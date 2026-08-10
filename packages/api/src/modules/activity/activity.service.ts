import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

const db = (prisma: PrismaService) => prisma;

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
export class ActivityService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async ensureRules() {
    for (const rule of DEFAULT_RULES) {
      const existing = await db(this.prisma).activityRule.findUnique({ where: { key: rule.key } });
      if (!existing) {
        await db(this.prisma).activityRule.create({ data: rule });
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
    const rule = await db(this.prisma).activityRule.findUnique({ where: { key: ruleKey } });
    if (!rule || !rule.active) return null;

    if (rule.cooldownMs) {
      const recent = await db(this.prisma).agentActivity.findFirst({
        where: { agentId, ruleId: rule.id },
        orderBy: { createdAt: 'desc' },
      });
      if (recent && Date.now() - new Date(recent.createdAt).getTime() < rule.cooldownMs) {
        return null;
      }
    }

    const activity = await db(this.prisma).agentActivity.create({
      data: {
        agentId,
        ruleId: rule.id,
        points: rule.points,
        metadata: (metadata ?? {}) as Prisma.InputJsonValue,
      },
    });

    const points = await db(this.prisma).agentPoints.upsert({
      where: { agentId },
      update: { totalPoints: { increment: rule.points } },
      create: { agentId, totalPoints: rule.points, tier: 'bronze' },
    });

    const newTier = this.calculateTier(points.totalPoints);
    if (newTier !== points.tier) {
      await db(this.prisma).agentPoints.update({
        where: { agentId },
        data: { tier: newTier },
      });
    }

    await this.audit.log({
      entityType: 'AgentActivity',
      entityId: activity.id,
      action: 'POINTS_AWARDED',
      actor,
      metadata: { ruleKey, points: rule.points, total: points.totalPoints + rule.points },
    });

    return { activity, totalPoints: points.totalPoints + rule.points, tier: newTier, pointsAwarded: rule.points };
  }

  async getLeaderboard(limit = 20) {
    const agents = await db(this.prisma).agentPoints.findMany({
      where: { totalPoints: { gt: 0 } },
      orderBy: { totalPoints: 'desc' },
      take: limit,
      include: { agent: true },
    });

    return agents.map((a: any, i: number) => ({
      rank: i + 1,
      agentId: a.agentId,
      agentName: `${a.agent.firstName} ${a.agent.lastName}`,
      avatar: a.agent.avatar,
      totalPoints: a.totalPoints,
      tier: a.tier,
    }));
  }

  async getAgentStats(agentId: string) {
    const [points, recentActivity, activityByCategory] = await Promise.all([
      db(this.prisma).agentPoints.findUnique({ where: { agentId } }),
      db(this.prisma).agentActivity.findMany({
        where: { agentId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { rule: true },
      }),
      db(this.prisma).agentActivity.groupBy({
        by: ['ruleId'],
        where: { agentId },
        _sum: { points: true },
        _count: true,
      }),
    ]);

    const rules = await db(this.prisma).activityRule.findMany();
    const ruleMap = Object.fromEntries(rules.map((r: any) => [r.id, r]));

    return {
      totalPoints: points?.totalPoints ?? 0,
      tier: points?.tier ?? 'bronze',
      recentActivity: recentActivity.map((a: any) => ({
        id: a.id,
        ruleLabel: a.rule.label,
        points: a.points,
        category: a.rule.category,
        createdAt: a.createdAt,
      })),
      categoryBreakdown: activityByCategory.map((g: any) => ({
        category: ruleMap[g.ruleId]?.category ?? 'unknown',
        label: ruleMap[g.ruleId]?.label ?? 'Unknown',
        points: g._sum.points ?? 0,
        count: g._count,
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
