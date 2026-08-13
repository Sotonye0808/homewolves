import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrmService } from './crm.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';

type MockFn = ReturnType<typeof vi.fn>;

describe('CrmService', () => {
  let service: CrmService;
  let prisma: PrismaService;
  let audit: { log: MockFn };
  let activityService: { awardForUser: MockFn };

  const userFindUnique = vi.fn();
  const clientFindFirst = vi.fn();
  const clientFindUnique = vi.fn();
  const clientCreate = vi.fn();
  const clientUpdate = vi.fn();
  const clientFindMany = vi.fn();
  const clientCount = vi.fn();
  const noteCreate = vi.fn();
  const noteFindMany = vi.fn();
  const ratingCreate = vi.fn();
  const ratingFindMany = vi.fn();
  const inspectionFindUnique = vi.fn();
  const inspectionCreate = vi.fn();
  const inspectionFindMany = vi.fn();
  const inspectionCount = vi.fn();
  const inspectionUpdate = vi.fn();
  const messageCount = vi.fn();
  const listingFindUnique = vi.fn();

  const actor = { id: 'agent-1', role: 'AGENT', name: 'Ada Okon' };
  const client = { id: 'c-1', agentId: 'agent-1', buyerId: 'buyer-1', status: 'active', createdAt: new Date(), updatedAt: new Date() };

  beforeEach(() => {
    vi.resetAllMocks();
    prisma = {
      user: { findUnique: userFindUnique },
      client: {
        findFirst: clientFindFirst,
        findUnique: clientFindUnique,
        create: clientCreate,
        update: clientUpdate,
        findMany: clientFindMany,
        count: clientCount,
      },
      note: { create: noteCreate, findMany: noteFindMany },
      rating: { create: ratingCreate, findMany: ratingFindMany },
      inspection: {
        findUnique: inspectionFindUnique,
        create: inspectionCreate,
        findMany: inspectionFindMany,
        count: inspectionCount,
        update: inspectionUpdate,
      },
      message: { count: messageCount },
      listing: { findUnique: listingFindUnique },
    } as unknown as PrismaService;
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    activityService = { awardForUser: vi.fn().mockResolvedValue(null) };
    service = new CrmService(prisma, audit as unknown as AuditService, activityService as unknown as ActivityService);
  });

  describe('createClient', () => {
    it('creates a client for an existing buyer and audits', async () => {
      userFindUnique.mockResolvedValue({ id: 'buyer-1' });
      clientFindFirst.mockResolvedValue(null);
      clientCreate.mockResolvedValue({ ...client, id: 'c-1' });

      const result = await service.createClient({ buyerId: 'buyer-1' }, 'agent-1', actor);

      expect(clientCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ agentId: 'agent-1', buyerId: 'buyer-1', status: 'active' }) }),
      );
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'CLIENT_CREATED' }));
      expect(activityService.awardForUser).toHaveBeenCalledWith('agent-1', 'AGENT', 'client_added', actor, expect.anything());
      expect(result.id).toBe('c-1');
    });

    it('throws NotFound when buyer does not exist', async () => {
      userFindUnique.mockResolvedValue(null);
      await expect(service.createClient({ buyerId: 'buyer-x' }, 'agent-1', actor)).rejects.toThrow('Buyer not found');
    });

    it('rejects duplicate client assignment', async () => {
      userFindUnique.mockResolvedValue({ id: 'buyer-1' });
      clientFindFirst.mockResolvedValue({ id: 'c-existing' });
      await expect(service.createClient({ buyerId: 'buyer-1' }, 'agent-1', actor)).rejects.toThrow('already assigned');
    });
  });

  describe('getClientById', () => {
    it('forbids access by a different agent', async () => {
      clientFindUnique.mockResolvedValue({ ...client, agentId: 'other' });
      await expect(service.getClientById('c-1', 'agent-1')).rejects.toThrow('Not your client');
    });

    it('returns the client when owned', async () => {
      clientFindUnique.mockResolvedValue(client);
      const result = await service.getClientById('c-1', 'agent-1');
      expect(result.id).toBe('c-1');
    });
  });

  describe('addNote', () => {
    it('adds a note to an owned client', async () => {
      clientFindUnique.mockResolvedValue(client);
      noteCreate.mockResolvedValue({ id: 'n-1', clientId: 'c-1', content: 'Called buyer', authorId: 'agent-1' });

      const result = await service.addNote('c-1', { content: 'Called buyer' }, 'agent-1', actor);

      expect(noteCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ clientId: 'c-1', content: 'Called buyer', authorId: 'agent-1' }) }),
      );
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'NOTE_CREATED' }));
      expect(result.id).toBe('n-1');
    });
  });

  describe('addRating', () => {
    it('rejects out-of-range scores', async () => {
      await expect(service.addRating('c-1', { score: 6 }, 'agent-1', actor)).rejects.toThrow('Score must be between 1 and 5');
    });

    it('creates a rating and awards activity points on 5-star', async () => {
      clientFindUnique.mockResolvedValue(client);
      ratingCreate.mockResolvedValue({ id: 'r-1', clientId: 'c-1', score: 5, authorId: 'agent-1' });

      const result = await service.addRating('c-1', { score: 5, review: 'Great' }, 'agent-1', actor);

      expect(ratingCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ clientId: 'c-1', score: 5 }) }),
      );
      expect(activityService.awardForUser).toHaveBeenCalledWith('agent-1', 'AGENT', 'review_received', actor, expect.anything());
      expect(result.id).toBe('r-1');
    });
  });

  describe('createInspection', () => {
    it('creates an inspection for an owned client + existing listing', async () => {
      clientFindUnique.mockResolvedValue(client);
      listingFindUnique.mockResolvedValue({ id: 'l-1' });
      inspectionCreate.mockResolvedValue({ id: 'i-1', clientId: 'c-1', listingId: 'l-1', scheduledAt: new Date('2026-09-01T10:00:00Z') });

      const result = await service.createInspection(
        { clientId: 'c-1', listingId: 'l-1', scheduledAt: '2026-09-01T10:00:00Z' },
        'agent-1',
        actor,
      );

      expect(inspectionCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ clientId: 'c-1', listingId: 'l-1', scheduledAt: expect.any(Date), authorId: 'agent-1' }),
        }),
      );
      expect(activityService.awardForUser).toHaveBeenCalledWith('agent-1', 'AGENT', 'inspection_scheduled', actor, expect.anything());
      expect(result.id).toBe('i-1');
    });
  });

  describe('updateInspection', () => {
    it('updates an owned inspection', async () => {
      inspectionFindUnique.mockResolvedValue({ id: 'i-1', client: { agentId: 'agent-1' } });
      inspectionUpdate.mockResolvedValue({ id: 'i-1', status: 'completed' });

      const result = await service.updateInspection('i-1', { status: 'completed' }, 'agent-1', actor);

      expect(inspectionUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'i-1' }, data: expect.objectContaining({ status: 'completed' }) }),
      );
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'INSPECTION_completed' }));
      expect(result.id).toBe('i-1');
    });

    it('forbids updating another agents inspection', async () => {
      inspectionFindUnique.mockResolvedValue({ id: 'i-1', client: { agentId: 'other' } });
      await expect(service.updateInspection('i-1', { status: 'completed' }, 'agent-1', actor)).rejects.toThrow('Not your inspection');
    });
  });

  describe('getDashboardStats', () => {
    it('returns counts across clients, inspections, and messages', async () => {
      clientCount.mockResolvedValue(3);
      inspectionCount.mockResolvedValue(1);
      messageCount.mockResolvedValue(2);

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
