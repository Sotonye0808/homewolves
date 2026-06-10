import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecentlyViewedService {
  constructor(private prisma: PrismaService) {}

  async record(userId: string | null, sessionId: string | null, listingId: string) {
    const existing = await this.prisma.recentlyViewed.findFirst({
      where: {
        listingId,
        ...(userId ? { userId } : { sessionId }),
      },
    });

    if (existing) {
      await this.prisma.recentlyViewed.update({
        where: { id: existing.id },
        data: { viewedAt: new Date() },
      });
    } else {
      await this.prisma.recentlyViewed.create({
        data: { userId, sessionId, listingId },
      });
    }
  }

  async getRecent(userId: string | null, sessionId: string | null, limit = 6) {
    const recent = await this.prisma.recentlyViewed.findMany({
      where: {
        ...(userId ? { userId } : { sessionId }),
      },
      orderBy: { viewedAt: 'desc' },
      take: limit,
    });

    if (recent.length === 0) return [];

    const listingIds = recent.map((r) => r.listingId);
    const listings = await this.prisma.listing.findMany({
      where: { id: { in: listingIds } },
      include: { owner: true, media: true },
    });

    const listingMap = new Map(listings.map((l) => [l.id, l]));
    return listingIds.map((id) => listingMap.get(id)).filter(Boolean);
  }
}
