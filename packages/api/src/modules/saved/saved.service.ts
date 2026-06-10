import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SavedService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, listingId: string) {
    const existing = await this.prisma.savedCollection.findFirst({
      where: { userId, listingIds: { has: listingId } },
    });

    if (existing) {
      await this.prisma.savedCollection.update({
        where: { id: existing.id },
        data: { listingIds: existing.listingIds.filter((id) => id !== listingId) },
      });
      return { saved: false };
    }

    let collection = await this.prisma.savedCollection.findFirst({
      where: { userId, name: 'Favorites' },
    });

    if (collection) {
      await this.prisma.savedCollection.update({
        where: { id: collection.id },
        data: { listingIds: [...collection.listingIds, listingId] },
      });
    } else {
      await this.prisma.savedCollection.create({
        data: { userId, name: 'Favorites', listingIds: [listingId] },
      });
    }

    return { saved: true };
  }

  async getSaved(userId: string) {
    const collections = await this.prisma.savedCollection.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return collections;
  }

  async isSaved(userId: string, listingId: string) {
    const collection = await this.prisma.savedCollection.findFirst({
      where: { userId, listingIds: { has: listingId } },
    });
    return { saved: !!collection };
  }
}
