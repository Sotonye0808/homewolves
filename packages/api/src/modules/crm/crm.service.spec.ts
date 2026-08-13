import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrmService } from './crm.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { clients, notes, ratings, inspections } from '../../drizzle/schema';

type MockFn = ReturnType<typeof vi.fn>;

describe('CrmService', () => {
  let service: CrmService;
  let mocks: ReturnType<typeof createDrizzleMock>;
  let audit: { log: MockFn };
  let activityService: { awardForUser: MockFn };

  const actor = { id: 'agent-1', role: 'AGENT', name: 'Ada Okon' };
  const client = { id: 'c-1', agentId: 'agent-1', buyerId: 'buyer-1', status: 'active', createdAt: new Date(), updatedAt: new Date() };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks = createDrizzleMock();
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    activityService = { awardForUser: vi.fn().mockResolvedValue(null) };
    service = new CrmService(mocks.db, audit as unknown as AuditService, activityService as unknown as ActivityService);
  });

  describe('createClient', () => {
    it('creates a client for an existing buyer and audits', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([{ id: 'buyer-1' }]))
        .mockReturnValueOnce(createChain([]));
      mocks.insert.mockReturnValue(createChain([{ ...client, id: 'c-1' }]));
      mocks.table('clients').findFirst.mockResolvedValue({ ...client, agent: {}, buyer: {} });

      const result = await service.createClient({ buyerId: 'buyer-1' }, 'agent-1', actor);

      expect(mocks.insert).toHaveBeenCalledWith(clients);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CLIENT_CREATED' }));
      expect(activityService.awardForUser).toHaveBeenCalledWith('agent-1', 'AGENT', 'client_added', actor, expect.anything());
      expect(result!.id).toBe('c-1');
    });

    it('throws NotFound when buyer does not exist', async () => {
      mocks.select.mockReturnValue(createChain([]));
      await expect(service.createClient({ buyerId: 'buyer-x' }, 'agent-1', actor)).rejects.toThrow('Buyer not found');
    });

    it('rejects duplicate client assignment', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([{ id: 'buyer-1' }]))
        .mockReturnValueOnce(createChain([{ id: 'c-existing' }]));
      await expect(service.createClient({ buyerId: 'buyer-1' }, 'agent-1', actor)).rejects.toThrow('already assigned');
    });
  });

  describe('getClientById', () => {
    it('forbids access by a different agent', async () => {
      mocks.table('clients').findFirst.mockResolvedValue({ ...client, agentId: 'other' });
      await expect(service.getClientById('c-1', 'agent-1')).rejects.toThrow('Not your client');
    });

    it('returns the client when owned', async () => {
      mocks.table('clients').findFirst.mockResolvedValue(client);
      const result = await service.getClientById('c-1', 'agent-1');
      expect(result.id).toBe('c-1');
    });
  });

  describe('addNote', () => {
    it('adds a note to an owned client', async () => {
      mocks.select.mockReturnValue(createChain([client]));
      mocks.insert.mockReturnValue(createChain([{ id: 'n-1', clientId: 'c-1', content: 'Called buyer', authorId: 'agent-1' }]));
      mocks.table('notes').findFirst.mockResolvedValue({ id: 'n-1', clientId: 'c-1', author: {} });

      const result = await service.addNote('c-1', { content: 'Called buyer' }, 'agent-1', actor);

      expect(mocks.insert).toHaveBeenCalledWith(notes);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'NOTE_CREATED' }));
      expect(result!.id).toBe('n-1');
    });
  });

  describe('addRating', () => {
    it('rejects out-of-range scores', async () => {
      await expect(service.addRating('c-1', { score: 6 }, 'agent-1', actor)).rejects.toThrow('Score must be between 1 and 5');
    });

    it('creates a rating and awards activity points on 5-star', async () => {
      mocks.select.mockReturnValue(createChain([client]));
      mocks.insert.mockReturnValue(createChain([{ id: 'r-1', clientId: 'c-1', score: 5, authorId: 'agent-1' }]));
      mocks.table('ratings').findFirst.mockResolvedValue({ id: 'r-1', clientId: 'c-1', author: {} });

      const result = await service.addRating('c-1', { score: 5, review: 'Great' }, 'agent-1', actor);

      expect(mocks.insert).toHaveBeenCalledWith(ratings);
      expect(activityService.awardForUser).toHaveBeenCalledWith('agent-1', 'AGENT', 'review_received', actor, expect.anything());
      expect(result!.id).toBe('r-1');
    });
  });

  describe('createInspection', () => {
    it('creates an inspection for an owned client + existing listing', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([client]))
        .mockReturnValueOnce(createChain([{ id: 'l-1' }]));
      mocks.insert.mockReturnValue(createChain([{ id: 'i-1', clientId: 'c-1', listingId: 'l-1', scheduledAt: new Date('2026-09-01T10:00:00Z') }]));
      mocks.table('inspections').findFirst.mockResolvedValue({ id: 'i-1', client: {}, listing: {} });

      const result = await service.createInspection(
        { clientId: 'c-1', listingId: 'l-1', scheduledAt: '2026-09-01T10:00:00Z' },
        'agent-1',
        actor,
      );

      expect(mocks.insert).toHaveBeenCalledWith(inspections);
      expect(activityService.awardForUser).toHaveBeenCalledWith('agent-1', 'AGENT', 'inspection_scheduled', actor, expect.anything());
      expect(result!.id).toBe('i-1');
    });
  });

  describe('updateInspection', () => {
    it('updates an owned inspection', async () => {
      mocks.table('inspections').findFirst
        .mockResolvedValueOnce({ id: 'i-1', client: { agentId: 'agent-1' } })
        .mockResolvedValueOnce({ id: 'i-1', status: 'completed', client: { agentId: 'agent-1' }, listing: {} });
      mocks.update.mockReturnValue(createChain([]));

      const result = await service.updateInspection('i-1', { status: 'completed' }, 'agent-1', actor);

      expect(mocks.update).toHaveBeenCalledWith(inspections);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'INSPECTION_completed' }));
      expect(result!.id).toBe('i-1');
    });

    it('forbids updating another agents inspection', async () => {
      mocks.table('inspections').findFirst.mockResolvedValue({ id: 'i-1', client: { agentId: 'other' } });
      await expect(service.updateInspection('i-1', { status: 'completed' }, 'agent-1', actor)).rejects.toThrow('Not your inspection');
    });
  });

  describe('getDashboardStats', () => {
    it('returns counts across clients, inspections, and messages', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([{ value: 3 }]))
        .mockReturnValueOnce(createChain([{ value: 3 }]))
        .mockReturnValueOnce(createChain([{ value: 3 }]))
        .mockReturnValueOnce(createChain([{ value: 1 }]))
        .mockReturnValueOnce(createChain([{ value: 2 }]));

      const result = await service.getDashboardStats('agent-1');

      expect(result).toEqual({
        activeClients: 3,
        newThisMonth: 3,
        pendingClients: 3,
        todayInspections: 1,
        unreadMessages: 2,
      });
    });
  });
});
