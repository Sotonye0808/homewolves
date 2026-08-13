import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivityService } from './activity.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { AuditService } from '../audit/audit.service';
import { agentActivities, agentPoints } from '../../drizzle/schema';

type MockFn = ReturnType<typeof vi.fn>;

describe('ActivityService', () => {
  let service: ActivityService;
  let mocks: ReturnType<typeof createDrizzleMock>;
  let audit: { log: MockFn };

  const actor = { id: 'agent-1', role: 'AGENT', name: 'Test Agent' };

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = createDrizzleMock();
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    service = new ActivityService(mocks.db, audit as unknown as AuditService);
  });

  describe('award', () => {
    it('returns null when rule does not exist or is inactive', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([]))
        .mockReturnValueOnce(createChain([{ key: 'x', active: false, points: 10 }]));

      const result = await service.award('agent-1', 'listing_created', actor);
      expect(result).toBeNull();
      expect(mocks.insert).not.toHaveBeenCalled();

      const result2 = await service.award('agent-1', 'x', actor);
      expect(result2).toBeNull();
      expect(mocks.insert).not.toHaveBeenCalled();
    });

    it('respects cooldownMs on recent activity', async () => {
      mocks.select
        .mockReturnValueOnce(
          createChain([{ id: 'rule-1', key: 'message_sent', active: true, points: 1, cooldownMs: 60000 }]),
        )
        .mockReturnValueOnce(createChain([{ createdAt: new Date(Date.now() - 1000) }]));

      const result = await service.award('agent-1', 'message_sent', actor);
      expect(result).toBeNull();
      expect(mocks.insert).not.toHaveBeenCalled();
    });

    it('awards points, upserts total, upgrades tier, and audits', async () => {
      mocks.select
        .mockReturnValueOnce(
          createChain([{ id: 'rule-1', key: 'listing_created', active: true, points: 10, cooldownMs: null }]),
        )
        .mockReturnValueOnce(createChain([null]));

      mocks.insert
        .mockReturnValueOnce(createChain([{ id: 'activity-1', agentId: 'agent-1' }]))
        .mockReturnValueOnce(createChain([{ agentId: 'agent-1', totalPoints: 520, tier: 'bronze' }]));
      mocks.update.mockReturnValue(createChain([]));

      const result = await service.award('agent-1', 'listing_created', actor, { listingId: 'l-1' });

      expect(mocks.insert).toHaveBeenNthCalledWith(1, agentActivities);
      expect(mocks.insert).toHaveBeenNthCalledWith(2, agentPoints);
      expect(mocks.update).toHaveBeenCalledWith(agentPoints);
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
      expect(mocks.insert).not.toHaveBeenCalled();
    });

    it('awards points to agent roles', async () => {
      mocks.select.mockReturnValueOnce(
        createChain([{ id: 'rule-1', key: 'listing_created', active: true, points: 10, cooldownMs: null }]),
      );
      mocks.insert
        .mockReturnValueOnce(createChain([{ id: 'activity-1' }]))
        .mockReturnValueOnce(createChain([{ agentId: 'agent-1', totalPoints: 10, tier: 'bronze' }]));
      mocks.update.mockReturnValue(createChain([]));

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
