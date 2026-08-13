import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { and, desc, eq, gt, sql, sum, count } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { activityRules, agentActivities, agentPoints } from '../../drizzle/schema';

const AGENT_ROLES = ['AGENT', 'DEVELOPER', 'HOMEOWNER'];

const DEFAULT_RULES = [
  { key: 'listing_created', label: 'Listing Created', points: 10, category: 'listing' },
  { key: 'listing_sold', label: 'Listing Sold', points: 100, category: 'deal' },
  { key: 'client_added', label: 'Client Added', points: 5, category: 'crm' },
  { key: 'inspection_scheduled', label: 'Inspection Scheduled', points: 3, category: 'crm' },
  { key: 'message_sent', label: 'Message Sent', points: 1, category: 'communication', cooldownMs: 60000 },
  { key: 'transaction_created', label: 'Transaction Created', points: 15, category: 'deal' },
  { key: 'transaction_completed', label: 'Deal Closed', points: 200, category: 'deal' },
  { key: 'review_received', label: '5-Star Review', points: 20, category: 'crm' },
  { key: 'daily_login', label: 'Daily Login', points: 2, category: 'engagement', cooldownMs: 86400000 },
];

const TIER_THRESHOLDS = [
  { tier: 'bronze', minPoints: 0 },
  { tier: 'silver', minPoints: 500 },
  { tier: 'gold', minPoints: 2000 },
  { tier: 'platinum', minPoints: 5000 },
  { tier: 'diamond', minPoints: 10000 },
];

@Injectable()
export class ActivityService implements OnModuleInit {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    private db: DrizzleService,
    private audit: AuditService,
  ) {}

  async onModuleInit() {
    this.ensureRules()
      .then(() => this.logger.log('Activity rules ensured'))
      .catch((err) => this.logger.warn(`Could not seed activity rules: ${err.message}`));
  }

  async ensureRules() {
    for (const rule of DEFAULT_RULES) {
      const [existing] = await this.db
        .select()
        .from(activityRules)
        .where(eq(activityRules.key, rule.key));
      if (!existing) {
        await this.db.insert(activityRules).values(rule);
      }
    }
  }

  async awardForUser(
    userId: string,
    role: string,
    ruleKey: string,
    actor: ActorRef,
    metadata?: Record<string, unknown>,
  ) {
    if (!AGENT_ROLES.includes(role)) return null;
    return this.award(userId, ruleKey, actor, metadata);
  }

  async award(agentId: string, ruleKey: string, actor: ActorRef, metadata?: Record<string, unknown>) {
    const [rule] = await this.db.select().from(activityRules).where(eq(activityRules.key, ruleKey));
    if (!rule || !rule.active) return null;

    if (rule.cooldownMs) {
      const [recent] = await this.db
        .select()
        .from(agentActivities)
        .where(and(eq(agentActivities.agentId, agentId), eq(agentActivities.ruleId, rule.id)))
        .orderBy(desc(agentActivities.createdAt))
        .limit(1);
      if (recent && Date.now() - new Date(recent.createdAt).getTime() < rule.cooldownMs) {
        return null;
      }
    }

    const [activity] = await this.db
      .insert(agentActivities)
      .values({
        agentId,
        ruleId: rule.id,
        points: rule.points,
        metadata: metadata ?? {},
      })
      .returning();
    if (!activity) throw new Error('Failed to create activity');

    const [points] = await this.db
      .insert(agentPoints)
      .values({ agentId, totalPoints: rule.points, tier: 'bronze' })
      .onConflictDoUpdate({
        target: agentPoints.agentId,
        set: { totalPoints: sql`${agentPoints.totalPoints} + ${rule.points}` },
      })
      .returning();
    if (!points) throw new Error('Failed to award points');

    const newTier = this.calculateTier(points.totalPoints);
    if (newTier !== points.tier) {
      await this.db.update(agentPoints).set({ tier: newTier }).where(eq(agentPoints.agentId, agentId));
    }

    await this.audit.log({
      entityType: 'AgentActivity',
      entityId: activity.id,
      action: 'POINTS_AWARDED',
      actor,
      metadata: { ruleKey, points: rule.points, total: points.totalPoints },
    });

    return { activity, totalPoints: points.totalPoints, tier: newTier, pointsAwarded: rule.points };
  }

  async getLeaderboard(limit = 20) {
    const agents = await this.db.query.agentPoints.findMany({
      where: gt(agentPoints.totalPoints, 0),
      orderBy: desc(agentPoints.totalPoints),
      limit,
      with: { agent: true },
    });

    return agents.map((a, i: number) => ({
      rank: i + 1,
      agentId: a.agentId,
      agentName: `${a.agent.firstName} ${a.agent.lastName}`,
      avatar: a.agent.avatar,
      totalPoints: a.totalPoints,
      tier: a.tier,
    }));
  }

  async getAgentStats(agentId: string) {
    const [points, recentActivity, activityByCategory, rules] = await Promise.all([
      this.db.select().from(agentPoints).where(eq(agentPoints.agentId, agentId)).then((r) => r[0] ?? null),
      this.db.query.agentActivities.findMany({
        where: eq(agentActivities.agentId, agentId),
        orderBy: desc(agentActivities.createdAt),
        limit: 10,
        with: { rule: true },
      }),
      this.db
        .select({
          ruleId: agentActivities.ruleId,
          total: sum(agentActivities.points),
          ruleCount: count(),
        })
        .from(agentActivities)
        .where(eq(agentActivities.agentId, agentId))
        .groupBy(agentActivities.ruleId),
      this.db.select().from(activityRules),
    ]);

    const ruleMap = Object.fromEntries(rules.map((r) => [r.id, r]));

    return {
      totalPoints: points?.totalPoints ?? 0,
      tier: points?.tier ?? 'bronze',
      recentActivity: recentActivity.map((a) => ({
        id: a.id,
        ruleLabel: a.rule.label,
        points: a.points,
        category: a.rule.category,
        createdAt: a.createdAt,
      })),
      categoryBreakdown: activityByCategory.map((g) => ({
        category: ruleMap[g.ruleId]?.category ?? 'unknown',
        label: ruleMap[g.ruleId]?.label ?? 'Unknown',
        points: Number(g.total ?? 0),
        count: g.ruleCount,
      })),
    };
  }

  private calculateTier(totalPoints: number): string {
    for (let i = TIER_THRESHOLDS.length - 1; i >= 0; i--) {
      const threshold = TIER_THRESHOLDS[i]!;
      if (totalPoints >= threshold.minPoints) return threshold.tier;
    }
    return 'bronze';
  }

  async getTierInfo() {
    return TIER_THRESHOLDS;
  }
}
