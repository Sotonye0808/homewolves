import { Injectable } from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { recentlyViewed, listings } from '../../drizzle/schema';

@Injectable()
export class RecentlyViewedService {
  constructor(private db: DrizzleService) {}

  async record(userId: string | null, sessionId: string | null, listingId: string) {
    const [existing] = await this.db
      .select()
      .from(recentlyViewed)
      .where(
        and(
          eq(recentlyViewed.listingId, listingId),
          userId ? eq(recentlyViewed.userId, userId) : eq(recentlyViewed.sessionId, sessionId as string),
        ),
      )
      .limit(1);

    if (existing) {
      await this.db
        .update(recentlyViewed)
        .set({ viewedAt: new Date() })
        .where(eq(recentlyViewed.id, existing.id));
    } else {
      await this.db.insert(recentlyViewed).values({ userId, sessionId, listingId });
    }
  }

  async getRecent(userId: string | null, sessionId: string | null, limit = 6) {
    const recent = await this.db.query.recentlyViewed.findMany({
      where: userId ? eq(recentlyViewed.userId, userId) : eq(recentlyViewed.sessionId, sessionId as string),
      orderBy: desc(recentlyViewed.viewedAt),
      limit,
    });

    if (recent.length === 0) return [];

    const listingIds = recent.map((r) => r.listingId);
    const rows = await this.db.query.listings.findMany({
      where: inArray(listings.id, listingIds),
      with: { owner: true, media: true },
    });

    const listingMap = new Map(rows.map((l) => [l.id, l]));
    return listingIds.map((id) => listingMap.get(id)).filter(Boolean);
  }
}
