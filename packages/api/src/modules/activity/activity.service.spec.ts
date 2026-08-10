import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivityService } from './activity.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type MockFn = ReturnType<typeof vi.fn>;

describe('ActivityService', () => {
  let service: ActivityService;
  let prisma: PrismaService;
  let audit: { log: MockFn };

  const ruleFindUnique = vi.fn();
  const ruleCreate = vi.fn();
  const activityFindFirst = vi.fn();
  const activityCreate = vi.fn();
  const pointsUpsert = vi.fn();
  const pointsUpdate = vi.fn();

  const actor = { id: 'agent-1', role: 'AGENT', name: 'Test Agent' };

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = {
      activityRule: { findUnique: ruleFindUnique, create: ruleCreate, findMany: vi.fn() },
      agentActivity: { findFirst: activityFindFirst, create: activityCreate, findMany: vi.fn(), groupBy: vi.fn() },
      agentPoints: { findUnique: vi.fn(), upsert: pointsUpsert, update: pointsUpdate, findMany: vi.fn() },
      user: { findUnique: vi.fn() },
    } as unknown as PrismaService;
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    service = new ActivityService(prisma, audit as unknown as AuditService);
  });

  describe('award', () => {
    it('returns null when rule does not exist or is inactive', async () => {
      ruleFindUnique.mockResolvedValueOnce(null);
      const result = await service.award('agent-1', 'listing_created', actor);
      expect(result).toBeNull();
      expect(activityCreate).not.toHaveBeenCalled();

      ruleFindUnique.mockResolvedValueOnce({ key: 'x', active: false, points: 10 });
      const result2 = await service.award('agent-1', 'x', actor);
      expect(result2).toBeNull();
    });

    it('respects cooldownMs on recent activity', async () => {
      ruleFindUnique.mockResolvedValue({
        id: 'rule-1',
        key: 'message_sent',
        active: true,
        points: 1,
        cooldownMs: 60000,
      });
      activityFindFirst.mockResolvedValue({
        createdAt: new Date(Date.now() - 1000),
      });

      const result = await service.award('agent-1', 'message_sent', actor);
      expect(result).toBeNull();
      expect(activityCreate).not.toHaveBeenCalled();
    });

    it('awards points, upserts total, upgrades tier, and audits', async () => {
      ruleFindUnique.mockResolvedValue({
        id: 'rule-1',
        key: 'listing_created',
        active: true,
        points: 10,
        cooldownMs: null,
      });
      activityFindFirst.mockResolvedValue(null);
      activityCreate.mockResolvedValue({ id: 'activity-1', agentId: 'agent-1' });
      // upsert returns stored points (510) whose stored tier (bronze) is stale → triggers upgrade
      pointsUpsert.mockResolvedValue({ agentId: 'agent-1', totalPoints: 510, tier: 'bronze' });

      const result = await service.award('agent-1', 'listing_created', actor, { listingId: 'l-1' });

      expect(pointsUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: { totalPoints: { increment: 10 } },
        }),
      );
      // 510 → tier should become silver
      expect(pointsUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { agentId: 'agent-1' }, data: { tier: 'silver' } }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'POINTS_AWARDED',
          metadata: expect.objectContaining({ ruleKey: 'listing_created' }),
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({ totalPoints: 520, tier: 'silver', pointsAwarded: 10 }),
      );
    });
  });

  describe('awardForUser', () => {
    it('does not award points to non-agent roles', async () => {
      const result = await service.awardForUser('buyer-1', 'BUYER', 'listing_created', actor);
      expect(result).toBeNull();
      expect(activityCreate).not.toHaveBeenCalled();
    });

    it('awards points to agent roles', async () => {
      ruleFindUnique.mockResolvedValue({
        id: 'rule-1',
        key: 'listing_created',
        active: true,
        points: 10,
        cooldownMs: null,
      });
      activityFindFirst.mockResolvedValue(null);
      activityCreate.mockResolvedValue({ id: 'activity-1' });
      pointsUpsert.mockResolvedValue({ agentId: 'agent-1', totalPoints: 0, tier: 'bronze' });

      const result = await service.awardForUser('agent-1', 'AGENT', 'listing_created', actor);
      expect(result).not.toBeNull();
    });
  });

  describe('calculateTier', () => {
    it('maps thresholds correctly', () => {
      const svc = service as unknown as { calculateTier(totalPoints: number): string };
      expect(svc.calculateTier(0)).toBe('bronze');
      expect(svc.calculateTier(499)).toBe('bronze');
      expect(svc.calculateTier(500)).toBe('silver');
      expect(svc.calculateTier(2000)).toBe('gold');
      expect(svc.calculateTier(5000)).toBe('platinum');
      expect(svc.calculateTier(10000)).toBe('diamond');
    });
  });
});
