import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditService } from './audit.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;

  const auditEventCreate = vi.fn();
  const auditEventFindMany = vi.fn();
  const auditEventCount = vi.fn();

  const actor = { id: 'user-1', role: 'AGENT', name: 'Ada Okon' };

  beforeEach(() => {
    vi.resetAllMocks();
    prisma = {
      auditEvent: {
        create: auditEventCreate,
        findMany: auditEventFindMany,
        count: auditEventCount,
      },
    } as unknown as PrismaService;
    service = new AuditService(prisma);
  });

  describe('log', () => {
    it('persists an immutable audit event with actor details', async () => {
      auditEventCreate.mockResolvedValue({ id: 'evt-1' });
      await service.log({
        entityType: 'Listing',
        entityId: 'listing-1',
        action: 'LISTING_CREATED',
        actor,
        metadata: { category: 'BUY' },
      });

      expect(auditEventCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'Listing',
            entityId: 'listing-1',
            action: 'LISTING_CREATED',
            actorId: 'user-1',
            actorRole: 'AGENT',
            actorName: 'Ada Okon',
            metadata: { category: 'BUY' },
            deviceInfo: {},
          }),
        }),
      );
    });
  });

  describe('findAllFiltered', () => {
    it('applies filters, pagination, and returns total', async () => {
      auditEventFindMany.mockResolvedValue([{ id: 'evt-1' }]);
      auditEventCount.mockResolvedValue(1);

      const result = await service.findAllFiltered({
        entityType: 'Listing',
        action: 'LISTING_CREATED',
        page: 1,
        limit: 20,
      });

      expect(auditEventFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ entityType: 'Listing', action: { contains: 'LISTING_CREATED', mode: 'insensitive' } }),
          skip: 0,
          take: 20,
        }),
      );
      expect(result).toMatchObject({ total: 1, page: 1, limit: 20 });
    });

    it('builds a date range on timestamp', async () => {
      auditEventFindMany.mockResolvedValue([]);
      auditEventCount.mockResolvedValue(0);

      await service.findAllFiltered({ dateFrom: '2026-08-01', dateTo: '2026-08-10' });

      const arg = auditEventFindMany.mock.calls[0]![0];
      expect(arg.where.timestamp).toHaveProperty('gte');
      expect(arg.where.timestamp).toHaveProperty('lte');
    });
  });

  describe('exportCsv', () => {
    it('returns a CSV with headers and rows', async () => {
      auditEventFindMany.mockResolvedValue([
        { timestamp: new Date('2026-08-01T00:00:00Z'), actorName: 'Ada Okon', actorRole: 'AGENT', action: 'LISTING_CREATED', entityType: 'Listing', entityId: 'l-1', ipAddress: '1.2.3.4' },
      ]);

      const csv = await service.exportCsv({});

      expect(csv).toContain('Timestamp,Actor,Actor Role,Action,Entity Type,Entity ID,IP Address');
      expect(csv).toContain('Ada Okon');
    });
  });

  describe('exportPdf', () => {
    it('returns an HTML document with rows', async () => {
      auditEventFindMany.mockResolvedValue([{ id: 'evt-1' }]);
      auditEventCount.mockResolvedValue(1);

      const { html } = await service.exportPdf({});

      expect(html).toContain('<html>');
      expect(html).toContain('<table>');
    });
  });
});
