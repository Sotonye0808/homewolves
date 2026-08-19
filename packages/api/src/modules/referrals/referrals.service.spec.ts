import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReferralsService } from './referrals.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { AuditService } from '../audit/audit.service';
import { users, referrals, commissions } from '../../drizzle/schema';

type MockFn = ReturnType<typeof vi.fn>;

describe('ReferralsService', () => {
  let service: ReferralsService;
  let mocks: ReturnType<typeof createDrizzleMock>;
  let audit: { log: MockFn };
  let config: { get: MockFn };

  const actor = { id: 'buyer-1', role: 'BUYER', name: 'Test Buyer' };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks = createDrizzleMock();
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    config = { get: vi.fn().mockResolvedValue(0.05) };
    service = new ReferralsService(mocks.db, audit as unknown as AuditService, config as never);
  });

  describe('generateCode', () => {
    it('generates an 8-char uppercase code excluding ambiguous chars', () => {
      const code = ReferralsService.generateCode();
      expect(code).toHaveLength(8);
      expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{8}$/);
    });
  });

  describe('ensureCode', () => {
    it('returns existing code when present', async () => {
      mocks.select.mockReturnValue(createChain([{ id: 'u1', referralCode: 'HOMEWOLF' }]));
      const code = await service.ensureCode('u1');
      expect(code).toBe('HOMEWOLF');
      expect(mocks.update).not.toHaveBeenCalled();
    });

    it('generates and persists a code when missing', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([{ id: 'u1', referralCode: null }]))
        .mockReturnValue(createChain([]));
      mocks.update.mockReturnValue(createChain([]));

      const code = await service.ensureCode('u1');
      expect(code).toHaveLength(8);
      expect(mocks.update).toHaveBeenCalled();
    });
  });

  describe('resolveCode', () => {
    it('returns invalid for unknown code', async () => {
      mocks.select.mockReturnValue(createChain([]));
      const result = await service.resolveCode('NOPE1234');
      expect(result.valid).toBe(false);
    });

    it('returns referrer info for a known code', async () => {
      mocks.select.mockReturnValue(
        createChain([{ id: 'agent-1', firstName: 'Ada', lastName: 'Okon', role: 'AGENT' }]),
      );
      const result = await service.resolveCode('abcd1234', 'buyer-1');
      expect(result).toMatchObject({ valid: true, code: 'ABCD1234', referrerName: 'Ada Okon' });
      expect(result.isSelf).toBe(false);
    });
  });

  describe('applyCode', () => {
    it('rejects self-referral', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([{ id: 'u1', referralCode: 'SAME1234' }]))
        .mockReturnValueOnce(createChain([{ id: 'u1' }]));
      await expect(service.applyCode('u1', 'same1234', actor)).rejects.toThrow('own referral code');
    });

    it('rejects when a referral is already attached', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([{ id: 'agent-1', referralCode: 'AGENT123' }]))
        .mockReturnValueOnce(createChain([{ id: 'u1' }]))
        .mockReturnValue(createChain([{ id: 'r-1' }]));
      await expect(service.applyCode('u1', 'agent123', actor)).rejects.toThrow('already attached');
    });

    it('attaches user to referrer and creates a referral record', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([{ id: 'agent-1', referralCode: 'AGENT123' }]))
        .mockReturnValueOnce(createChain([{ id: 'u1', referredById: null }]))
        .mockReturnValue(createChain([]));

      const setArgs: Array<Record<string, unknown>> = [];
      mocks.update.mockReturnValue(
        createChain([], (method, args) => {
          if (method === 'set') setArgs.push(args[0] as Record<string, unknown>);
        }),
      );

      const valuesArgs: Array<Record<string, unknown>> = [];
      mocks.insert.mockReturnValue(
        createChain([{ id: 'r-1', code: 'AGENT123', referrerId: 'agent-1', referredId: 'u1' }], (method, args) => {
          if (method === 'values') valuesArgs.push(args[0] as Record<string, unknown>);
        }),
      );

      const result = await service.applyCode('u1', 'agent123', actor);

      expect(mocks.update).toHaveBeenCalledWith(users);
      expect(setArgs[0]).toEqual({ referredById: 'agent-1' });
      expect(mocks.insert).toHaveBeenCalledWith(referrals);
      expect(valuesArgs[0]).toMatchObject({ code: 'AGENT123', referrerId: 'agent-1', referredId: 'u1', status: 'active' });
      expect(result.referral.id).toBe('r-1');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REFERRAL_APPLIED' }),
      );
    });
  });

  describe('attributeOnDealCompleted', () => {
    it('returns null when user has no referral', async () => {
      mocks.select.mockReturnValue(createChain([]));
      const result = await service.attributeOnDealCompleted({
        referredUserId: 'u1',
        transactionId: 't-1',
        dealAmount: 50_000_000,
        actor,
      });
      expect(result).toBeNull();
      expect(mocks.insert).not.toHaveBeenCalled();
    });

    it('marks referral converted and attributes commission at configured rate', async () => {
      mocks.select.mockReturnValue(createChain([{ id: 'r-1', referrerId: 'agent-1', referredId: 'u1' }]));
      mocks.update.mockReturnValue(createChain([{ id: 'r-1', status: 'converted' }]));
      mocks.insert.mockReturnValue(createChain([{ id: 'c-1', amount: '2500000' }]));

      const result = await service.attributeOnDealCompleted({
        referredUserId: 'u1',
        transactionId: 't-1',
        dealAmount: 50_000_000,
        actor,
      });

      expect(config.get).toHaveBeenCalledWith('referral_commission_rate');
      expect(mocks.update).toHaveBeenCalledWith(referrals);
      expect(mocks.insert).toHaveBeenCalledWith(commissions);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COMMISSION_ATTRIBUTED' }),
      );
      expect(result?.commission.amount).toBe('2500000');
    });
  });
});
