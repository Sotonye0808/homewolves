import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionsService } from './transactions.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { ReferralsService } from '../referrals/referrals.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { transactions, listings } from '../../drizzle/schema';

type MockFn = ReturnType<typeof vi.fn>;

const buildSteps = () => [
  { id: 'offer', label: 'Offer Accepted', order: 0, status: 'pending' },
  { id: 'inspection', label: 'Inspection Completed', order: 1, status: 'pending' },
  { id: 'documentation', label: 'Documentation Signed', order: 2, status: 'pending' },
];

describe('TransactionsService', () => {
  let service: TransactionsService;
  let mocks: ReturnType<typeof createDrizzleMock>;
  let audit: { log: MockFn };
  let activityService: { awardForUser: MockFn };
  let referralsService: { attributeOnDealCompleted: MockFn };
  let analyticsService: { track: MockFn };

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
    mocks = createDrizzleMock();
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    activityService = { awardForUser: vi.fn().mockResolvedValue(null) };
    referralsService = { attributeOnDealCompleted: vi.fn().mockResolvedValue(null) };
    analyticsService = { track: vi.fn().mockResolvedValue(undefined) };
    service = new TransactionsService(
      mocks.db,
      audit as unknown as AuditService,
      activityService as unknown as ActivityService,
      referralsService as unknown as ReferralsService,
      analyticsService as unknown as AnalyticsService,
    );
  });

  describe('create', () => {
    it('creates a transaction with default steps and audits', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([{ id: 'l-1', ownerId: 'agent-1' }]))
        .mockReturnValueOnce(createChain([{ id: 'buyer-1' }]));
      const values: Array<Record<string, unknown>> = [];
      mocks.insert.mockReturnValue(
        createChain([{ ...transaction, id: 't-1' }], (method, args) => {
          if (method === 'values') values.push(args[0] as Record<string, unknown>);
        }),
      );
      mocks.table('transactions').findFirst.mockResolvedValue({ ...transaction, listing: {}, buyer: {}, agent: {} });

      const result = await service.create(
        { listingId: 'l-1', buyerId: 'buyer-1', type: 'PURCHASE' },
        'agent-1',
        actor,
      );

      expect(mocks.insert).toHaveBeenCalledWith(transactions);
      expect(values[0]).toMatchObject({
        listingId: 'l-1',
        buyerId: 'buyer-1',
        agentId: 'agent-1',
        type: 'PURCHASE',
        status: 'INITIATED',
        currentStep: 0,
        stepsJson: expect.arrayContaining([expect.objectContaining({ id: 'offer' })]),
      });
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'TRANSACTION_CREATED' }));
      expect(activityService.awardForUser).toHaveBeenCalledWith('agent-1', 'AGENT', 'transaction_created', actor, expect.anything());
      expect(analyticsService.track).toHaveBeenCalledWith(expect.objectContaining({ event: 'transaction_started' }));
      expect(result!.id).toBe('t-1');
    });

    it('throws NotFound when listing is missing', async () => {
      mocks.select.mockReturnValue(createChain([]));
      await expect(service.create({ listingId: 'l-x', buyerId: 'buyer-1', type: 'PURCHASE' }, 'agent-1', actor)).rejects.toThrow('Listing not found');
    });
  });

  describe('findAll', () => {
    it('scopes to the agent and filters by status', async () => {
      mocks.table('transactions').findMany.mockResolvedValue([transaction]);
      mocks.select.mockReturnValue(createChain([{ value: 1 }]));

      const result = await service.findAll('agent-1', 'AGENT', { status: 'INITIATED', page: 1, limit: 10 });

      expect(mocks.table('transactions').findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 0 }),
      );
      expect(result.total).toBe(1);
    });

    it('scopes to the buyer for BUYER role', async () => {
      mocks.table('transactions').findMany.mockResolvedValue([]);
      mocks.select.mockReturnValue(createChain([{ value: 0 }]));

      await service.findAll('buyer-1', 'BUYER', {});

      expect(mocks.table('transactions').findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 0 }),
      );
    });
  });

  describe('advance', () => {
    it('completes the final step and returns COMPLETED via complete()', async () => {
      const nearDone = { ...transaction, status: 'IN_PROGRESS', currentStep: 3, stepsJson: buildSteps() };
      mocks.select
        .mockReturnValueOnce(createChain([nearDone]))
        .mockReturnValue(createChain([{ id: 'agent-1', role: 'AGENT' }]));
      mocks.update.mockReturnValue(createChain([]));
      mocks.table('transactions').findFirst.mockResolvedValue({
        ...nearDone,
        status: 'COMPLETED',
        listing: { id: 'l-1', ownerId: 'agent-1', price: '40000000', currency: 'NGN' },
      });

      const result = await service.advance('t-1', {}, 'agent-1', actor);

      expect(mocks.update).toHaveBeenNthCalledWith(1, transactions);
      expect(mocks.update).toHaveBeenNthCalledWith(2, listings);
      expect(activityService.awardForUser).toHaveBeenCalledWith('agent-1', 'AGENT', 'transaction_completed', actor, expect.anything());
      expect(referralsService.attributeOnDealCompleted).toHaveBeenCalled();
      expect(result!.status).toBe('COMPLETED');
    });

    it('forbids advancing another agents transaction', async () => {
      mocks.select.mockReturnValue(createChain([{ ...transaction, agentId: 'other-agent' }]));
      await expect(service.advance('t-1', {}, 'agent-1', actor)).rejects.toThrow('Only the agent can advance');
    });

    it('throws when the transaction is not active', async () => {
      mocks.select.mockReturnValue(createChain([{ ...transaction, status: 'COMPLETED' }]));
      await expect(service.advance('t-1', {}, 'agent-1', actor)).rejects.toThrow('Transaction is not active');
    });
  });

  describe('reject', () => {
    it('rejects and marks the current step rejected', async () => {
      mocks.select.mockReturnValue(createChain([{ ...transaction, status: 'IN_PROGRESS', currentStep: 1 }]));
      mocks.update.mockReturnValue(createChain([]));
      mocks.table('transactions').findFirst.mockResolvedValue({ ...transaction, status: 'REJECTED' });

      const result = await service.reject('t-1', { reason: 'Buyer backed out' }, 'agent-1', actor);

      expect(mocks.update).toHaveBeenCalledWith(transactions);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'TRANSACTION_REJECTED' }));
      expect(result!.status).toBe('REJECTED');
    });
  });

  describe('cancel', () => {
    it('allows buyer or agent to cancel', async () => {
      mocks.select.mockReturnValue(createChain([{ ...transaction, status: 'IN_PROGRESS' }]));
      mocks.update.mockReturnValue(createChain([]));
      mocks.table('transactions').findFirst.mockResolvedValue({ ...transaction, status: 'CANCELLED' });

      const result = await service.cancel('t-1', 'buyer-1', actor);

      expect(mocks.update).toHaveBeenCalledWith(transactions);
      expect(result!.status).toBe('CANCELLED');
    });

    it('forbids non-participants from cancelling', async () => {
      mocks.select.mockReturnValue(createChain([transaction]));
      await expect(service.cancel('t-1', 'stranger', actor)).rejects.toThrow('Not your transaction');
    });
  });
});
