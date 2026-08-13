import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListingService } from './listing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AlertsService } from '../alerts/alerts.service';

type MockFn = ReturnType<typeof vi.fn>;

describe('ListingService', () => {
  let service: ListingService;
  let prisma: PrismaService;
  let audit: { log: MockFn };
  let activityService: { awardForUser: MockFn };
  let analyticsService: { track: MockFn };
  let alertsService: { checkNewListingMatch: MockFn; checkPriceDrop: MockFn };

  const listingCreate = vi.fn();
  const listingFindUnique = vi.fn();
  const listingFindMany = vi.fn();
  const listingCount = vi.fn();
  const listingUpdate = vi.fn();
  const listingDelete = vi.fn();
  const mediaCreate = vi.fn();
  const featuredFindMany = vi.fn();

  const actor = { id: 'agent-1', role: 'AGENT', name: 'Ada Okon' };
  const listing = {
    id: 'l-1',
    title: '3 Bedroom Duplex',
    description: 'A lovely duplex',
    price: 50_000_000,
    currency: 'NGN',
    category: 'SALE',
    propertyType: 'DUPLEX',
    ownerId: 'agent-1',
    agentId: 'agent-1',
    status: 'ACTIVE',
    locationJson: { state: 'Lagos', city: 'Ikeja' },
    amenityIds: [],
    metadata: {},
    viewCount: 0,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    prisma = {
      listing: {
        create: listingCreate,
        findUnique: listingFindUnique,
        findMany: listingFindMany,
        count: listingCount,
        update: listingUpdate,
        delete: listingDelete,
      },
      media: { create: mediaCreate },
      featuredPlacement: { findMany: featuredFindMany },
    } as unknown as PrismaService;
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    activityService = { awardForUser: vi.fn().mockResolvedValue(null) };
    analyticsService = { track: vi.fn().mockResolvedValue(undefined) };
    alertsService = { checkNewListingMatch: vi.fn().mockResolvedValue(undefined), checkPriceDrop: vi.fn().mockResolvedValue(undefined) };
    service = new ListingService(
      prisma,
      audit as unknown as AuditService,
      activityService as unknown as ActivityService,
      analyticsService as unknown as AnalyticsService,
      alertsService as unknown as AlertsService,
    );
  });

  describe('create', () => {
    it('creates a listing, audits, and fires alerts + activity', async () => {
      listingCreate.mockResolvedValue({ ...listing, id: 'l-1' });

      const result = await service.create(
        {
          title: '3 Bedroom Duplex',
          description: 'A lovely duplex',
          price: 50_000_000,
          currency: 'NGN',
          category: 'SALE',
          propertyType: 'DUPLEX',
          locationJson: { state: 'Lagos' },
        },
        'agent-1',
        actor,
      );

      expect(listingCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ ownerId: 'agent-1', agentId: 'agent-1', category: 'SALE' }),
        }),
      );
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_CREATED' }));
      expect(alertsService.checkNewListingMatch).toHaveBeenCalledWith('l-1');
      expect(activityService.awardForUser).toHaveBeenCalledWith(
        'agent-1',
        'AGENT',
        'listing_created',
        actor,
        expect.objectContaining({ listingId: 'l-1' }),
      );
      expect(result.id).toBe('l-1');
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      listingFindUnique.mockResolvedValue(null);
      await expect(service.findById('l-x')).rejects.toThrow('Listing not found');
    });

    it('returns the listing when found', async () => {
      listingFindUnique.mockResolvedValue(listing);
      const result = await service.findById('l-1');
      expect(result.id).toBe('l-1');
    });
  });

  describe('findAll', () => {
    it('builds filters and returns paginated results', async () => {
      listingFindMany.mockResolvedValue([listing]);
      listingCount.mockResolvedValue(1);

      const result = await service.findAll({ category: 'SALE', status: 'ACTIVE', minPrice: 1_000_000, maxPrice: 100_000_000, search: 'duplex' });

      expect(listingFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
          category: 'SALE',
            status: 'ACTIVE',
            price: { gte: 1_000_000, lte: 100_000_000 },
            OR: [
              { title: { contains: 'duplex', mode: 'insensitive' } },
              { description: { contains: 'duplex', mode: 'insensitive' } },
            ],
          }),
          skip: 0,
          take: 12,
        }),
      );
      expect(result.total).toBe(1);
    });
  });

  describe('update', () => {
    it('forbids updates by non-owners', async () => {
      listingFindUnique.mockResolvedValue({ ...listing, ownerId: 'someone-else' });
      await expect(service.update('l-1', { price: 10 }, 'agent-1', actor)).rejects.toThrow('Not your listing');
    });

    it('updates fields, audits, and fires a price-drop alert', async () => {
      listingFindUnique.mockResolvedValue({ ...listing, price: 50_000_000 });
      listingUpdate.mockResolvedValue({ ...listing, price: 40_000_000 });

      const result = await service.update('l-1', { price: 40_000_000 }, 'agent-1', actor);

      expect(listingUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'l-1' }, data: expect.objectContaining({ price: 40_000_000 }) }),
      );
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_UPDATED' }));
      expect(alertsService.checkPriceDrop).toHaveBeenCalledWith('l-1', 50_000_000, 40_000_000);
      expect(result.price).toBe(40_000_000);
    });
  });

  describe('updateStatus', () => {
    it('rejects when status update is not owned', async () => {
      listingFindUnique.mockResolvedValue({ ...listing, ownerId: 'other' });
      await expect(service.updateStatus('l-1', { status: 'ACTIVE' }, 'agent-1', actor)).rejects.toThrow('Not your listing');
    });

    it('updates the status and audits with from/to', async () => {
      listingFindUnique.mockResolvedValue({ ...listing, status: 'PENDING' });
      listingUpdate.mockResolvedValue({ ...listing, status: 'ACTIVE' });

      await service.updateStatus('l-1', { status: 'ACTIVE' }, 'agent-1', actor);

      expect(listingUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'l-1' }, data: { status: 'ACTIVE' } }),
      );
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LISTING_STATUS_ACTIVE', metadata: { from: 'PENDING', to: 'ACTIVE' } }),
      );
    });
  });

  describe('moderateListing', () => {
    it('approves a pending listing to ACTIVE', async () => {
      listingFindUnique.mockResolvedValue({ ...listing, status: 'PENDING' });
      listingUpdate.mockResolvedValue({ ...listing, status: 'ACTIVE' });

      await service.moderateListing('l-1', 'approve', actor);

      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_APPROVED' }));
    });

    it('rejects to DRAFT', async () => {
      listingFindUnique.mockResolvedValue({ ...listing, status: 'PENDING' });
      listingUpdate.mockResolvedValue({ ...listing, status: 'DRAFT' });

      await service.moderateListing('l-1', 'reject', actor);

      expect(listingUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: 'DRAFT' } }),
      );
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_REJECTED' }));
    });
  });

  describe('getFeatured', () => {
    it('returns active placements mapped to their listings', async () => {
      featuredFindMany.mockResolvedValue([{ id: 'p-1', listing: listing }]);
      const result = await service.getFeatured();
      expect(result).toEqual([listing]);
      expect(featuredFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active', endDate: { gt: expect.any(Date) } },
        }),
      );
    });
  });

  describe('delete', () => {
    it('deletes an owned listing and audits', async () => {
      listingFindUnique.mockResolvedValue(listing);
      listingDelete.mockResolvedValue(listing);

      await service.delete('l-1', 'agent-1', actor);

      expect(listingDelete).toHaveBeenCalledWith({ where: { id: 'l-1' } });
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_DELETED' }));
    });

    it('forbids deleting another owner listing', async () => {
      listingFindUnique.mockResolvedValue({ ...listing, ownerId: 'other' });
      await expect(service.delete('l-1', 'agent-1', actor)).rejects.toThrow('Not your listing');
    });
  });

  describe('attachMedia', () => {
    it('attaches media to an owned listing', async () => {
      listingFindUnique.mockResolvedValue(listing);
      mediaCreate.mockImplementation(({ data }) => Promise.resolve(data));

      const result = await service.attachMedia(
        'l-1',
        [{ url: 'https://img/x.jpg', type: 'image', isPrimary: true }],
        'agent-1',
      );

      expect(mediaCreate).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ listingId: 'l-1', url: 'https://img/x.jpg', isPrimary: true, displayOrder: 0 }) }),
      );
      expect(result).toHaveLength(1);
    });
  });

  describe('incrementView', () => {
    it('increments viewCount and tracks analytics', async () => {
      listingUpdate.mockResolvedValue({ ...listing, agentId: 'agent-1' });
      await service.incrementView('l-1');
      expect(listingUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ data: { viewCount: { increment: 1 } } }),
      );
      expect(analyticsService.track).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'listing_view', listingId: 'l-1', agentId: 'agent-1' }),
      );
    });
  });
});
