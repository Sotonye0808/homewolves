import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ListingService } from './listing.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { AlertsService } from '../alerts/alerts.service';
import { listings, media } from '../../drizzle/schema';

type MockFn = ReturnType<typeof vi.fn>;

describe('ListingService', () => {
  let service: ListingService;
  let mocks: ReturnType<typeof createDrizzleMock>;
  let audit: { log: MockFn };
  let activityService: { awardForUser: MockFn };
  let analyticsService: { track: MockFn };
  let alertsService: { checkNewListingMatch: MockFn; checkPriceDrop: MockFn };

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
    mocks = createDrizzleMock();
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    activityService = { awardForUser: vi.fn().mockResolvedValue(null) };
    analyticsService = { track: vi.fn().mockResolvedValue(undefined) };
    alertsService = { checkNewListingMatch: vi.fn().mockResolvedValue(undefined), checkPriceDrop: vi.fn().mockResolvedValue(undefined) };
    service = new ListingService(
      mocks.db,
      audit as unknown as AuditService,
      activityService as unknown as ActivityService,
      analyticsService as unknown as AnalyticsService,
      { send: vi.fn().mockResolvedValue({ status: 'simulated' }) } as never,
      alertsService as unknown as AlertsService,
    );
  });

  describe('create', () => {
    it('creates a listing, audits, and fires alerts + activity', async () => {
      mocks.insert.mockReturnValue(createChain([{ ...listing, id: 'l-1' }]));
      mocks.table('listings').findFirst.mockResolvedValue({ ...listing, owner: {}, media: [] });

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

      expect(mocks.insert).toHaveBeenCalledWith(listings);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_CREATED' }));
      expect(alertsService.checkNewListingMatch).toHaveBeenCalledWith('l-1');
      expect(activityService.awardForUser).toHaveBeenCalledWith(
        'agent-1',
        'AGENT',
        'listing_created',
        actor,
        expect.objectContaining({ listingId: 'l-1' }),
      );
      expect(result!.id).toBe('l-1');
    });
  });

  describe('findById', () => {
    it('throws NotFoundException when missing', async () => {
      mocks.table('listings').findFirst.mockResolvedValue(null);
      await expect(service.findById('l-x')).rejects.toThrow('Listing not found');
    });

    it('returns the listing when found', async () => {
      mocks.table('listings').findFirst.mockResolvedValue(listing);
      const result = await service.findById('l-1');
      expect(result.id).toBe('l-1');
    });
  });

  describe('findAll', () => {
    it('builds filters and returns paginated results', async () => {
      mocks.table('listings').findMany.mockResolvedValue([listing]);
      mocks.select.mockReturnValue(createChain([{ value: 1 }]));

      const result = await service.findAll({ category: 'SALE', status: 'ACTIVE', minPrice: 1_000_000, maxPrice: 100_000_000, search: 'duplex' });

      expect(mocks.table('listings').findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 12, offset: 0 }),
      );
      expect(result.total).toBe(1);
    });
  });

  describe('update', () => {
    it('forbids updates by non-owners', async () => {
      mocks.select.mockReturnValue(createChain([{ ...listing, ownerId: 'someone-else' }]));
      await expect(service.update('l-1', { price: 10 }, 'agent-1', actor)).rejects.toThrow('Not your listing');
    });

    it('updates fields, audits, and fires a price-drop alert', async () => {
      mocks.select.mockReturnValue(createChain([{ ...listing, price: '50000000' }]));
      mocks.update.mockReturnValue(createChain([]));
      mocks.table('listings').findFirst.mockResolvedValue({ ...listing, price: 40_000_000 });

      const result = await service.update('l-1', { price: 40_000_000 }, 'agent-1', actor);

      expect(mocks.update).toHaveBeenCalledWith(listings);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_UPDATED' }));
      expect(alertsService.checkPriceDrop).toHaveBeenCalledWith('l-1', 50_000_000, 40_000_000);
      expect(result!.price).toBe(40_000_000);
    });
  });

  describe('updateStatus', () => {
    it('rejects when status update is not owned', async () => {
      mocks.select.mockReturnValue(createChain([{ ...listing, ownerId: 'other' }]));
      await expect(service.updateStatus('l-1', { status: 'ACTIVE' }, 'agent-1', actor)).rejects.toThrow('Not your listing');
    });

    it('updates the status and audits with from/to', async () => {
      mocks.select.mockReturnValue(createChain([{ ...listing, status: 'PENDING' }]));
      mocks.update.mockReturnValue(createChain([]));
      mocks.table('listings').findFirst.mockResolvedValue({ ...listing, status: 'ACTIVE' });

      await service.updateStatus('l-1', { status: 'ACTIVE' }, 'agent-1', actor);

      expect(mocks.update).toHaveBeenCalledWith(listings);
      expect(audit.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LISTING_STATUS_ACTIVE', metadata: { from: 'PENDING', to: 'ACTIVE' } }),
      );
    });
  });

  describe('moderateListing', () => {
    it('approves a pending listing to ACTIVE and awards listing_approved points', async () => {
      mocks.select.mockReturnValue(createChain([{ ...listing, status: 'PENDING' }]));
      mocks.update.mockReturnValue(createChain([]));
      mocks.table('listings').findFirst.mockResolvedValue({
        ...listing,
        status: 'ACTIVE',
        owner: { id: 'agent-1', role: 'AGENT', email: 'agent@homewolves.africa', firstName: 'Ada' },
      });

      await service.moderateListing('l-1', 'approve', actor);

      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_APPROVED' }));
      expect(activityService.awardForUser).toHaveBeenCalledWith(
        'agent-1',
        'AGENT',
        'listing_approved',
        actor,
        expect.objectContaining({ listingId: 'l-1' }),
      );
    });

    it('rejects to DRAFT without awarding points', async () => {
      mocks.select.mockReturnValue(createChain([{ ...listing, status: 'PENDING' }]));
      mocks.update.mockReturnValue(createChain([]));
      mocks.table('listings').findFirst.mockResolvedValue({ ...listing, status: 'DRAFT' });

      await service.moderateListing('l-1', 'reject', actor);

      expect(mocks.update).toHaveBeenCalledWith(listings);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_REJECTED' }));
      expect(activityService.awardForUser).not.toHaveBeenCalled();
    });
  });

  describe('getFeatured', () => {
    it('returns active placements mapped to their listings', async () => {
      mocks.table('featuredPlacements').findMany.mockResolvedValue([{ id: 'p-1', listing }]);
      const result = await service.getFeatured();
      expect(result).toEqual([listing]);
      expect(mocks.table('featuredPlacements').findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.anything() }),
      );
    });
  });

  describe('delete', () => {
    it('deletes an owned listing and audits', async () => {
      mocks.select.mockReturnValue(createChain([listing]));

      await service.delete('l-1', 'agent-1', actor);

      expect(mocks.delete).toHaveBeenCalledWith(listings);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'LISTING_DELETED' }));
    });

    it('forbids deleting another owner listing', async () => {
      mocks.select.mockReturnValue(createChain([{ ...listing, ownerId: 'other' }]));
      await expect(service.delete('l-1', 'agent-1', actor)).rejects.toThrow('Not your listing');
    });
  });

  describe('attachMedia', () => {
    it('attaches media to an owned listing', async () => {
      mocks.select.mockReturnValue(createChain([listing]));
      mocks.insert.mockReturnValue(
        createChain([{ url: 'https://img/x.jpg', type: 'image', isPrimary: true, displayOrder: 0 }]),
      );

      const result = await service.attachMedia(
        'l-1',
        [{ url: 'https://img/x.jpg', type: 'image', isPrimary: true }],
        'agent-1',
      );

      expect(mocks.insert).toHaveBeenCalledWith(media);
      expect(result).toHaveLength(1);
    });
  });

  describe('incrementView', () => {
    it('increments viewCount and tracks analytics', async () => {
      mocks.update.mockReturnValue(createChain([{ ...listing, agentId: 'agent-1' }]));
      await service.incrementView('l-1');
      expect(mocks.update).toHaveBeenCalledWith(listings);
      expect(analyticsService.track).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'listing_view', listingId: 'l-1', agentId: 'agent-1' }),
      );
    });
  });
});
