import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

const db = (prisma: PrismaService) => prisma;

@Injectable()
export class AlertsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async checkPriceDrop(listingId: string, oldPrice: number, newPrice: number) {
    if (newPrice >= oldPrice) return;

    const dropPercent = Math.round((1 - newPrice / oldPrice) * 100);
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { title: true, id: true },
    });
    if (!listing) return;

    const savedBy = await db(this.prisma).savedCollection.findMany({
      where: { listingIds: { has: listingId } },
      select: { userId: true },
    });

    const recentlyViewedBy = await db(this.prisma).recentlyViewed.findMany({
      where: { listingId },
      select: { userId: true },
    });

    const userIds = new Set<string>();
    for (const s of savedBy) if (s.userId) userIds.add(s.userId);
    for (const r of recentlyViewedBy) if (r.userId) userIds.add(r.userId);

    for (const userId of userIds) {
      await this.notificationsService.createAndDispatch(
        {
          userId,
          type: 'PRICE_DROP',
          title: 'Price Drop!',
          body: `${listing.title} dropped by ${dropPercent}% (${new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(newPrice)})`,
          data: { listingId, oldPrice, newPrice, dropPercent },
        },
        (uid, n) => this.notificationsGateway.sendNotification(uid, n),
      );
    }
  }

  async checkNewListingMatch(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        title: true,
        id: true,
        price: true,
        category: true,
        propertyType: true,
        amenityIds: true,
        locationJson: true,
      },
    });
    if (!listing) return;

    const location = listing.locationJson as any;
    const users = await this.prisma.user.findMany({
      where: { verified: true },
      select: { id: true, preferences: true },
    });

    for (const user of users) {
      const prefs = (user.preferences as any)?.savedSearches as any[];
      if (!prefs?.length) continue;

      for (const search of prefs) {
        if (search.category && search.category !== listing.category) continue;
        if (search.propertyType && search.propertyType !== listing.propertyType) continue;
        if (search.maxPrice && Number(listing.price) > search.maxPrice) continue;
        if (search.minPrice && Number(listing.price) < search.minPrice) continue;
        if (search.location && location) {
          const locStr = `${location.state ?? ''} ${location.city ?? ''} ${location.area ?? ''}`.toLowerCase();
          if (!locStr.includes(search.location.toLowerCase())) continue;
        }

        await this.notificationsService.createAndDispatch(
          {
            userId: user.id,
            type: 'NEW_MATCHING_LISTING',
            title: 'New Matching Listing',
            body: `${listing.title} matches your saved search`,
            data: { listingId, searchFilter: search },
          },
          (uid, n) => this.notificationsGateway.sendNotification(uid, n),
        );
        break;
      }
    }
  }
}
