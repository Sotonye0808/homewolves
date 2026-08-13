import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionsService } from './transactions.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { ReferralsService } from '../referrals/referrals.service';
import { AnalyticsService } from '../analytics/analytics.service';

type MockFn = ReturnType<typeof vi.fn>;

const buildSteps = () => [
  { id: 'offer', label: 'Offer Accepted', order: 0, status: 'pending' },
  { id: 'inspection', label: 'Inspection Completed', order: 1, status: 'pending' },
  { id: 'documentation', label: 'Documentation Signed', order: 2, status: 'pending' },
];

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: PrismaService;
  let audit: { log: MockFn };
  let activityService: { awardForUser: MockFn };
  let referralsService: { attributeOnDealCompleted: MockFn };
  let analyticsService: { track: MockFn };

  const listingFindUnique = vi.fn();
  const userFindUnique = vi.fn();
  const transactionCreate = vi.fn();
  const transactionFindUnique = vi.fn();
  const transactionFindMany = vi.fn();
  const transactionCount = vi.fn();
  const transactionUpdate = vi.fn();
  const paymentCreate = vi.fn();
  const paymentFindMany = vi.fn();
  const paymentUpdate = vi.fn();
  const listingUpdate = vi.fn();

  const actor = { id: 'agent-1', role: 'AGENT', name: 'Ada Okon' };
  const transaction = {
    id: 't-1',
    listingId: 'l-1',
    buyerId: 'buyer-1',
    agentId: 'agent-1',
    type: 'PURCHASE',
    status: 'INITIATED',
    currentStep: 0,
    stepsJson: buildSteps(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    prisma = {
      listing: { findUnique: listingFindUnique, update: listingUpdate },
      user: { findUnique: userFindUnique },
      transaction: {
        create: transactionCreate,
        findUnique: transactionFindUnique,
        findMany: transactionFindMany,
        count: transactionCount,
        update: transactionUpdate,
      },
      paymentRecord: {
        create: paymentCreate,
        findMany: paymentFindMany,
        update: paymentUpdate,
      },
    } as unknown as PrismaService;
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    activityService = { awardForUser: vi.fn().mockResolvedValue(null) };
    referralsService = { attributeOnDealCompleted: vi.fn().mockResolvedValue(null) };
    analyticsService = { track: vi.fn().mockResolvedValue(undefined) };
    service = new TransactionsService(
      prisma,
      audit as unknown as AuditService,
      activityService as unknown as ActivityService,
      referralsService as unknown as ReferralsService,
      analyticsService as unknown as AnalyticsService,
    );
  });

  describe('create', () => {
    it('creates a transaction with default steps and audits', async () => {
      listingFindUnique.mockResolvedValue({ id: 'l-1', ownerId: 'agent-1' });
      userFindUnique.mockResolvedValue({ id: 'buyer-1' });
      transactionCreate.mockResolvedValue({ ...transaction, id: 't-1' });

      const result = await service.create(
        { listingId: 'l-1', buyerId: 'buyer-1', type: 'PURCHASE' },
        'agent-1',
        actor,
      );

      expect(transactionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            listingId: 'l-1',
            buyerId: 'buyer-1',
            agentId: 'agent-1',
            type: 'PURCHASE',
            status: 'INITIATED',
            currentStep: 0,
            stepsJson: expect.arrayContaining([expect.objectContaining({ id: 'offer' })]),
          }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'TRANSACTION_CREATED' }));
      expect(activityService.awardForUser).toHaveBeenCalledWith('agent-1', 'AGENT', 'transaction_created', actor, expect.anything());
      expect(analyticsService.track).toHaveBeenCalledWith(expect.objectContaining({ event: 'transaction_started' }));
      expect(result.id).toBe('t-1');
    });

    it('throws NotFound when listing is missing', async () => {
      listingFindUnique.mockResolvedValue(null);
      await expect(service.create({ listingId: 'l-x', buyerId: 'buyer-1', type: 'PURCHASE' }, 'agent-1', actor)).rejects.toThrow('Listing not found');
    });
  });

  describe('findAll', () => {
    it('scopes to the agent and filters by status', async () => {
      transactionFindMany.mockResolvedValue([transaction]);
      transactionCount.mockResolvedValue(1);

      const result = await service.findAll('agent-1', 'AGENT', { status: 'INITIATED', page: 1, limit: 10 });

      expect(transactionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ agentId: 'agent-1', status: 'INITIATED' }) }),
      );
      expect(result.total).toBe(1);
    });

    it('scopes to the buyer for BUYER role', async () => {
      transactionFindMany.mockResolvedValue([]);
      transactionCount.mockResolvedValue(0);

      await service.findAll('buyer-1', 'BUYER', {});

      expect(transactionFindMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ buyerId: 'buyer-1' }) }),
      );
    });
  });

  describe('advance', () => {
    it('completes the final step and returns COMPLETED via complete()', async () => {
      const nearDone = { ...transaction, status: 'IN_PROGRESS', currentStep: 3, stepsJson: buildSteps() };
      transactionFindUnique.mockResolvedValue(nearDone);
      transactionUpdate.mockResolvedValue({ ...nearDone, status: 'COMPLETED', listing: { id: 'l-1', ownerId: 'agent-1' } });
      listingUpdate.mockResolvedValue({ id: 'l-1', status: 'SOLD' });
      userFindUnique.mockResolvedValue({ id: 'agent-1', role: 'AGENT' });

      const result = await service.advance('t-1', {}, 'agent-1', actor);

      expect(transactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ status: 'COMPLETED' }) }),
      );
      expect(listingUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'l-1' }, data: { status: 'SOLD' } }),
      );
      expect(activityService.awardForUser).toHaveBeenCalledWith('agent-1', 'AGENT', 'transaction_completed', actor, expect.anything());
      expect(referralsService.attributeOnDealCompleted).toHaveBeenCalled();
      expect(result.status).toBe('COMPLETED');
    });

    it('forbids advancing another agents transaction', async () => {
      transactionFindUnique.mockResolvedValue({ ...transaction, agentId: 'other-agent' });
      await expect(service.advance('t-1', {}, 'agent-1', actor)).rejects.toThrow('Only the agent can advance');
    });

    it('throws when the transaction is not active', async () => {
      transactionFindUnique.mockResolvedValue({ ...transaction, status: 'COMPLETED' });
      await expect(service.advance('t-1', {}, 'agent-1', actor)).rejects.toThrow('Transaction is not active');
    });
  });

  describe('reject', () => {
    it('rejects and marks the current step rejected', async () => {
      transactionFindUnique.mockResolvedValue({ ...transaction, status: 'IN_PROGRESS', currentStep: 1 });
      transactionUpdate.mockResolvedValue({ ...transaction, status: 'REJECTED' });

      const result = await service.reject('t-1', { reason: 'Buyer backed out' }, 'agent-1', actor);

      expect(transactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't-1' }, data: expect.objectContaining({ status: 'REJECTED' }) }),
      );
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'TRANSACTION_REJECTED' }));
      expect(result.status).toBe('REJECTED');
    });
  });

  describe('cancel', () => {
    it('allows buyer or agent to cancel', async () => {
      transactionFindUnique.mockResolvedValue({ ...transaction, status: 'IN_PROGRESS' });
      transactionUpdate.mockResolvedValue({ ...transaction, status: 'CANCELLED' });

      const result = await service.cancel('t-1', 'buyer-1', actor);

      expect(transactionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 't-1' }, data: expect.objectContaining({ status: 'CANCELLED' }) }),
      );
      expect(result.status).toBe('CANCELLED');
    });

    it('forbids non-participants from cancelling', async () => {
      transactionFindUnique.mockResolvedValue(transaction);
      await expect(service.cancel('t-1', 'stranger', actor)).rejects.toThrow('Not your transaction');
    });
  });
});