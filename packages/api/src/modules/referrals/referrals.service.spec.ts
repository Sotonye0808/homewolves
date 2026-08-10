import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ReferralsService } from './referrals.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type MockFn = ReturnType<typeof vi.fn>;

describe('ReferralsService', () => {
  let service: ReferralsService;
  let prisma: PrismaService;
  let audit: { log: MockFn };
  let config: { get: MockFn };

  const userFindUnique = vi.fn();
  const userFindFirst = vi.fn();
  const userUpdate = vi.fn();
  const referralFindUnique = vi.fn();
  const referralFindMany = vi.fn();
  const referralCreate = vi.fn();
  const referralUpdate = vi.fn();
  const commissionCreate = vi.fn();
  const commissionFindMany = vi.fn();
  const commissionAggregate = vi.fn();

  const actor = { id: 'buyer-1', role: 'BUYER', name: 'Test Buyer' };

  beforeEach(() => {
    vi.resetAllMocks();
    prisma = {
      user: {
        findUnique: userFindUnique,
        findFirst: userFindFirst,
        update: userUpdate,
      },
      referral: {
        findUnique: referralFindUnique,
        findMany: referralFindMany,
        create: referralCreate,
        update: referralUpdate,
      },
      commission: {
        create: commissionCreate,
        findMany: commissionFindMany,
        aggregate: commissionAggregate,
      },
    } as unknown as PrismaService;
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    config = { get: vi.fn().mockResolvedValue(0.05) };
    service = new ReferralsService(prisma, audit as unknown as AuditService, config as never);
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
      userFindUnique.mockResolvedValue({ id: 'u1', referralCode: 'HOMEWOLF' });
      const code = await service.ensureCode('u1');
      expect(code).toBe('HOMEWOLF');
      expect(userUpdate).not.toHaveBeenCalled();
    });

    it('generates and persists a code when missing', async () => {
      userFindUnique
        .mockResolvedValueOnce({ id: 'u1', referralCode: null })
        .mockResolvedValue(null);
      userUpdate.mockResolvedValue({ id: 'u1', referralCode: 'ABCDEF12' });
      const code = await service.ensureCode('u1');
      expect(code).toHaveLength(8);
      expect(userUpdate).toHaveBeenCalled();
    });
  });

  describe('resolveCode', () => {
    it('returns invalid for unknown code', async () => {
      userFindUnique.mockResolvedValue(null);
      const result = await service.resolveCode('NOPE1234');
      expect(result.valid).toBe(false);
    });

    it('returns referrer info for a known code', async () => {
      userFindUnique.mockResolvedValue({ id: 'agent-1', firstName: 'Ada', lastName: 'Okon', role: 'AGENT' });
      const result = await service.resolveCode('abcd1234', 'buyer-1');
      expect(result).toMatchObject({ valid: true, code: 'ABCD1234', referrerName: 'Ada Okon' });
      expect(result.isSelf).toBe(false);
    });
  });

  describe('applyCode', () => {
    it('rejects self-referral', async () => {
      userFindUnique
        .mockResolvedValueOnce({ id: 'u1', referralCode: 'SAME1234' })
        .mockResolvedValueOnce({ id: 'u1' });
      await expect(service.applyCode('u1', 'same1234', actor)).rejects.toThrow('own referral code');
    });

    it('rejects when a referral is already attached', async () => {
      userFindUnique
        .mockResolvedValueOnce({ id: 'agent-1', referralCode: 'AGENT123' })
        .mockResolvedValueOnce({ id: 'u1' });
      referralFindUnique.mockResolvedValue({ id: 'r-1' });
      await expect(service.applyCode('u1', 'agent123', actor)).rejects.toThrow('already attached');
    });

    it('attaches user to referrer and creates a referral record', async () => {
      userFindUnique
        .mockResolvedValueOnce({ id: 'agent-1', referralCode: 'AGENT123' })
        .mockResolvedValueOnce({ id: 'u1', referredById: null });
      referralFindUnique.mockResolvedValue(null);
      userUpdate.mockResolvedValue({ id: 'u1', referredById: 'agent-1' });
      referralCreate.mockResolvedValue({ id: 'r-1', code: 'AGENT123', referrerId: 'agent-1', referredId: 'u1' });

      const result = await service.applyCode('u1', 'agent123', actor);

      expect(userUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { referredById: 'agent-1' } }),
      );
      expect(referralCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ code: 'AGENT123', referrerId: 'agent-1', referredId: 'u1', status: 'active' }),
        }),
      );
      expect(result.referral.id).toBe('r-1');
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REFERRAL_APPLIED' }),
      );
    });
  });

  describe('attributeOnDealCompleted', () => {
    it('returns null when user has no referral', async () => {
      referralFindUnique.mockResolvedValue(null);
      const result = await service.attributeOnDealCompleted({
        referredUserId: 'u1',
        transactionId: 't-1',
        dealAmount: 50_000_000,
        actor,
      });
      expect(result).toBeNull();
      expect(commissionCreate).not.toHaveBeenCalled();
    });

    it('marks referral converted and attributes commission at configured rate', async () => {
      referralFindUnique.mockResolvedValue({ id: 'r-1', referrerId: 'agent-1', referredId: 'u1' });
      referralUpdate.mockResolvedValue({ id: 'r-1', status: 'converted' });
      commissionCreate.mockResolvedValue({ id: 'c-1', amount: 2_500_000 });

      const result = await service.attributeOnDealCompleted({
        referredUserId: 'u1',
        transactionId: 't-1',
        dealAmount: 50_000_000,
        actor,
      });

      expect(config.get).toHaveBeenCalledWith('referral_commission_rate');
      expect(referralUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'r-1' }, data: expect.objectContaining({ status: 'converted' }) }),
      );
      expect(commissionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referrerId: 'agent-1',
            transactionId: 't-1',
            amount: 2_500_000,
            status: 'payable',
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COMMISSION_ATTRIBUTED' }),
      );
      expect(result?.commission.amount).toBe(2_500_000);
    });
  });
});
