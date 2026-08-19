import { Injectable } from '@nestjs/common';
import { eq, inArray, sql } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EmailService } from '../email/email.service';
import { listings, savedCollections, recentlyViewed, users } from '../../drizzle/schema';

@Injectable()
export class AlertsService {
  constructor(
    private db: DrizzleService,
    private notificationsService: NotificationsService,
    private notificationsGateway: NotificationsGateway,
    private emailService: EmailService,
  ) {}

  async checkPriceDrop(listingId: string, oldPrice: number, newPrice: number) {
    if (newPrice >= oldPrice) return;

    const dropPercent = Math.round((1 - newPrice / oldPrice) * 100);
    const [listing] = await this.db.select({ title: listings.title, id: listings.id }).from(listings).where(eq(listings.id, listingId));
    if (!listing) return;

    const savedBy = await this.db.select({ userId: savedCollections.userId }).from(savedCollections).where(sql`${savedCollections.listingIds} @> ARRAY[${listingId}]`);

    const recentlyViewedBy = await this.db.select({ userId: recentlyViewed.userId }).from(recentlyViewed).where(eq(recentlyViewed.listingId, listingId));

    const userIds = new Set<string>();
    for (const s of savedBy) if (s.userId) userIds.add(s.userId);
    for (const r of recentlyViewedBy) if (r.userId) userIds.add(r.userId);

    let watchers: { id: string; email: string | null; firstName: string | null }[] = [];
    if (userIds.size > 0) {
      watchers = await this.db
        .select({ id: users.id, email: users.email, firstName: users.firstName })
        .from(users)
        .where(inArray(users.id, [...userIds]));
    }

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

    for (const watcher of watchers) {
      if (!watcher.email) continue;
      void this.emailService.send(watcher.email, 'price_drop', {
        firstName: watcher.firstName ?? 'there',
        listingTitle: listing.title ?? '',
        listingId,
        oldPrice: String(oldPrice),
        newPrice: String(newPrice),
        dropPercent: `${dropPercent}%`,
      });
    }
  }

  async checkNewListingMatch(listingId: string) {
    const [listing] = await this.db
      .select({
        title: listings.title,
        id: listings.id,
        price: listings.price,
        category: listings.category,
        propertyType: listings.propertyType,
        amenityIds: listings.amenityIds,
        locationJson: listings.locationJson,
      })
      .from(listings)
      .where(eq(listings.id, listingId));
    if (!listing) return;

    const location = listing.locationJson as Record<string, string> | null;
    const rows = await this.db
      .select({ id: users.id, preferences: users.preferences })
      .from(users)
      .where(eq(users.verified, true));

    interface SavedSearch {
      category?: string;
      propertyType?: string;
      minPrice?: number;
      maxPrice?: number;
      location?: string;
    }

    for (const user of rows) {
      const prefs = (user.preferences as { savedSearches?: SavedSearch[] } | null)?.savedSearches ?? [];
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
