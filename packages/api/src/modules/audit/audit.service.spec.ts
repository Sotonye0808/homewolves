import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuditService } from './audit.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { auditEvents } from '../../drizzle/schema';

describe('AuditService', () => {
  let service: AuditService;
  let mocks: ReturnType<typeof createDrizzleMock>;

  const actor = { id: 'user-1', role: 'AGENT', name: 'Ada Okon' };

  beforeEach(() => {
    vi.resetAllMocks();
    mocks = createDrizzleMock();
    service = new AuditService(mocks.db);
  });

  describe('log', () => {
    it('persists an immutable audit event with actor details', async () => {
      const values: Array<Record<string, unknown>> = [];
      mocks.insert.mockReturnValue(
        createChain([], (method, args) => {
          if (method === 'values') values.push(args[0] as Record<string, unknown>);
        }),
      );

      await service.log({
        entityType: 'Listing',
        entityId: 'listing-1',
        action: 'LISTING_CREATED',
        actor,
        metadata: { category: 'BUY' },
      });

      expect(mocks.insert).toHaveBeenCalledWith(auditEvents);
      expect(values[0]).toMatchObject({
        entityType: 'Listing',
        entityId: 'listing-1',
        action: 'LISTING_CREATED',
        actorId: 'user-1',
        actorRole: 'AGENT',
        actorName: 'Ada Okon',
        metadata: { category: 'BUY' },
        deviceInfo: {},
      });
    });
  });

  describe('findAllFiltered', () => {
    it('applies filters, pagination, and returns total', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([{ id: 'evt-1' }]))
        .mockReturnValueOnce(createChain([{ value: 1 }]));

      const result = await service.findAllFiltered({
        entityType: 'Listing',
        action: 'LISTING_CREATED',
        page: 1,
        limit: 20,
      });

      expect(mocks.select).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({ total: 1, page: 1, limit: 20, events: [{ id: 'evt-1' }] });
    });

    it('builds a date range on timestamp', async () => {
      mocks.select.mockReturnValue(createChain([]));

      const result = await service.findAllFiltered({ dateFrom: '2026-08-01', dateTo: '2026-08-10' });

      expect(mocks.select).toHaveBeenCalledTimes(2);
      expect(result.total).toBe(0);
    });
  });

  describe('exportCsv', () => {
    it('returns a CSV with headers and rows', async () => {
      mocks.select.mockReturnValue(
        createChain([
          { timestamp: new Date('2026-08-01T00:00:00Z'), actorName: 'Ada Okon', actorRole: 'AGENT', action: 'LISTING_CREATED', entityType: 'Listing', entityId: 'l-1', ipAddress: '1.2.3.4' },
        ]),
      );

      const csv = await service.exportCsv({});

      expect(csv).toContain('Timestamp,Actor,Actor Role,Action,Entity Type,Entity ID,IP Address');
      expect(csv).toContain('Ada Okon');
    });
  });

  describe('exportPdf', () => {
    it('returns an HTML document with rows', async () => {
      mocks.select
        .mockReturnValueOnce(createChain([{ id: 'evt-1' }]))
        .mockReturnValueOnce(createChain([{ value: 1 }]));

      const { html } = await service.exportPdf({});

      expect(html).toContain('<html>');
      expect(html).toContain('<table>');
    });
  });
});
