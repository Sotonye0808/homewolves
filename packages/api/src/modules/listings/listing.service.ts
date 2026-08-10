import { Injectable, NotFoundException, ForbiddenException, Optional, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AlertsService } from '../alerts/alerts.service';
import { ActivityService } from '../activity/activity.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { UpdateListingDto, UpdateListingStatusDto } from './dto/update-listing.dto';
import type { Prisma } from '@prisma/client';

@Injectable()
export class ListingService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private activityService: ActivityService,
    private analyticsService: AnalyticsService,
    @Optional() @Inject(AlertsService) private alertsService?: AlertsService,
  ) {}

  async create(dto: CreateListingDto, ownerId: string, actor: ActorRef) {
    const listing = await this.prisma.listing.create({
      data: {
        title: dto.title,
        description: dto.description,
        price: dto.price,
        currency: dto.currency ?? 'NGN',
        category: dto.category,
        propertyType: dto.propertyType,
        locationJson: dto.locationJson as Prisma.InputJsonValue,
        amenityIds: dto.amenityIds ?? [],
        metadata: (dto.metadata ?? {}) as Prisma.InputJsonValue,
        ownerId,
        agentId: dto.agentId ?? ownerId,
      },
      include: { owner: true, media: true },
    });

    await this.audit.log({
      entityType: 'Listing',
      entityId: listing.id,
      action: 'LISTING_CREATED',
      actor,
      metadata: { category: dto.category, propertyType: dto.propertyType },
    });

    if (this.alertsService) {
      this.alertsService.checkNewListingMatch(listing.id).catch(() => {});
    }

    this.activityService
      .awardForUser(ownerId, actor.role, 'listing_created', actor, { listingId: listing.id })
      .catch(() => {});

    return listing;
  }

  async findById(id: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { owner: true, media: true },
    });
    if (!listing) throw new NotFoundException('Listing not found');
    return listing;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    category?: string;
    propertyType?: string;
    status?: string;
    minPrice?: number;
    maxPrice?: number;
    search?: string;
    ownerId?: string;
    featured?: boolean;
  }) {
    const where: any = {};
    if (params.category) where.category = params.category;
    if (params.propertyType) where.propertyType = params.propertyType;
    if (params.status) where.status = params.status;
    if (params.ownerId) where.ownerId = params.ownerId;
    if (params.featured != null) where.featured = params.featured;
    if (params.minPrice != null || params.maxPrice != null) {
      where.price = {};
      if (params.minPrice != null) where.price.gte = params.minPrice;
      if (params.maxPrice != null) where.price.lte = params.maxPrice;
    }
    if (params.search) {
      where.OR = [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    const [listings, total] = await Promise.all([
      this.prisma.listing.findMany({
        where,
        skip: params.skip ?? 0,
        take: params.take ?? 12,
        orderBy: { createdAt: 'desc' },
        include: { owner: true, media: true },
      }),
      this.prisma.listing.count({ where }),
    ]);

    return { listings, total, skip: params.skip ?? 0, take: params.take ?? 12 };
  }

  async update(id: string, dto: UpdateListingDto, userId: string, actor: ActorRef) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId) throw new ForbiddenException('Not your listing');

    const oldPrice = Number(listing.price);
    const data: any = { ...dto };
    if (dto.locationJson) data.locationJson = dto.locationJson as Prisma.InputJsonValue;
    if (dto.metadata) data.metadata = dto.metadata as Prisma.InputJsonValue;

    const updated = await this.prisma.listing.update({
      where: { id },
      data,
      include: { owner: true, media: true },
    });

    await this.audit.log({
      entityType: 'Listing',
      entityId: id,
      action: 'LISTING_UPDATED',
      actor,
      metadata: { changes: Object.keys(dto) },
    });

    if (dto.price != null && this.alertsService) {
      const newPrice = Number(dto.price);
      this.alertsService.checkPriceDrop(id, oldPrice, newPrice).catch(() => {});
    }

    return updated;
  }

  async updateStatus(id: string, dto: UpdateListingStatusDto, userId: string, actor: ActorRef) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId) throw new ForbiddenException('Not your listing');

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: dto.status },
      include: { owner: true, media: true },
    });

    await this.audit.log({
      entityType: 'Listing',
      entityId: id,
      action: `LISTING_STATUS_${dto.status}`,
      actor,
      metadata: { from: listing.status, to: dto.status },
    });

    return updated;
  }

  async getPendingModeration() {
    return this.prisma.listing.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
      include: { owner: true, media: true },
    });
  }

  async moderateListing(id: string, action: 'approve' | 'reject', actor: ActorRef) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');

    const newStatus = action === 'approve' ? 'ACTIVE' : 'DRAFT';
    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: newStatus },
      include: { owner: true, media: true },
    });

    await this.audit.log({
      entityType: 'Listing',
      entityId: id,
      action: action === 'approve' ? 'LISTING_APPROVED' : 'LISTING_REJECTED',
      actor,
      metadata: { from: listing.status, to: newStatus },
    });

    return updated;
  }

  async delete(id: string, userId: string, actor: ActorRef) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId) throw new ForbiddenException('Not your listing');

    await this.prisma.listing.delete({ where: { id } });

    await this.audit.log({
      entityType: 'Listing',
      entityId: id,
      action: 'LISTING_DELETED',
      actor,
    });
  }

  async getFeatured() {
    const now = new Date();
    const placements = await this.prisma.featuredPlacement.findMany({
      where: { status: 'active', endDate: { gt: now } },
      orderBy: { startDate: 'desc' },
      take: 6,
      include: { listing: { include: { owner: true, media: true } } },
    });
    return placements.map((p) => p.listing);
  }

  async uploadMediaUrl(filename: string, _contentType: string) {
    // Stub: in production, generate presigned S3 URL
    return {
      uploadUrl: `https://storage.homewolves.africa/stub/${filename}`,
      publicUrl: `https://storage.homewolves.africa/stub/${filename}`,
      expiresIn: 3600,
    };
  }

  async attachMedia(listingId: string, mediaData: { url: string; type: string; isPrimary?: boolean; altText?: string }[], userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId) throw new ForbiddenException('Not your listing');

    const media = await Promise.all(
      mediaData.map((m, i) =>
        this.prisma.media.create({
          data: {
            listingId,
            url: m.url,
            type: m.type,
            altText: m.altText,
            isPrimary: m.isPrimary ?? false,
            displayOrder: i,
          },
        }),
      ),
    );
    return media;
  }

  async incrementView(id: string) {
    const updated = await this.prisma.listing.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
    this.analyticsService
      .track({
        event: 'listing_view',
        listingId: id,
        agentId: updated.agentId ?? undefined,
        metadata: { category: updated.category, propertyType: updated.propertyType },
      })
      .catch(() => {});
  }
}
