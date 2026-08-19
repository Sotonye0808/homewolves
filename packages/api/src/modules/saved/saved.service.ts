import { Injectable } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { savedCollections } from '../../drizzle/schema';

@Injectable()
export class SavedService {
  constructor(
    private db: DrizzleService,
    private analyticsService: AnalyticsService,
  ) {}

  async toggle(userId: string, listingId: string) {
    const [existing] = await this.db
      .select()
      .from(savedCollections)
      .where(and(eq(savedCollections.userId, userId), sql`${savedCollections.listingIds} @> ARRAY[${listingId}]`))
      .limit(1);

    if (existing) {
      const listingIds = existing.listingIds.filter((id) => id !== listingId);
      await this.db
        .update(savedCollections)
        .set({ listingIds })
        .where(eq(savedCollections.id, existing.id));
      return { saved: false };
    }

    const [collection] = await this.db
      .select()
      .from(savedCollections)
      .where(and(eq(savedCollections.userId, userId), eq(savedCollections.name, 'Favorites')))
      .limit(1);

    if (collection) {
      await this.db
        .update(savedCollections)
        .set({ listingIds: [...collection.listingIds, listingId] })
        .where(eq(savedCollections.id, collection.id));
    } else {
      await this.db.insert(savedCollections).values({ userId, name: 'Favorites', listingIds: [listingId] });
    }

    this.analyticsService
      .track({ event: 'listing_saved', userId, listingId, metadata: { saved: true } })
      .catch(() => {});

    return { saved: true };
  }

  async getSaved(userId: string) {
    return this.db.query.savedCollections.findMany({
      where: eq(savedCollections.userId, userId),
      orderBy: desc(savedCollections.updatedAt),
    });
  }

  async isSaved(userId: string, listingId: string) {
    const [collection] = await this.db
      .select()
      .from(savedCollections)
      .where(and(eq(savedCollections.userId, userId), sql`${savedCollections.listingIds} @> ARRAY[${listingId}]`))
      .limit(1);
    return { saved: !!collection };
  }
}
