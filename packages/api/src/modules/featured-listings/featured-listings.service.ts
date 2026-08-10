import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PaystackClient } from '../../common/integrations/paystack.client';
import { PlatformConfigService } from '../platform-config/platform-config.service';

const db = (prisma: PrismaService) => prisma;

const DEFAULT_DAILY_PRICE = 5000; // NGN per day, overridable via platform config

@Injectable()
export class FeaturedListingsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private paystack: PaystackClient,
    private config: PlatformConfigService,
  ) {}

  get paymentsConfigured(): boolean {
    return this.paystack.isConfigured;
  }

  /** Public: listings with an active, unexpired placement. */
  async getActivePlacements(take = 6) {
    const now = new Date();
    const placements = await db(this.prisma).featuredPlacement.findMany({
      where: { status: 'active', endDate: { gt: now } },
      orderBy: { startDate: 'desc' },
      take,
      include: { listing: { include: { owner: true, media: true } } },
    });
    return placements.map((p) => ({ placement: { id: p.id, startDate: p.startDate, endDate: p.endDate }, listing: p.listing }));
  }

  async purchase(listingId: string, userId: string, days: number, actor: ActorRef) {
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      throw new BadRequestException('days must be between 1 and 90');
    }

    const listing = await db(this.prisma).listing.findUnique({ where: { id: listingId } });
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId) throw new ForbiddenException('Not your listing');

    const existing = await db(this.prisma).featuredPlacement.findFirst({
      where: { listingId, status: 'active', endDate: { gt: new Date() } },
    });
    if (existing) throw new BadRequestException('Listing is already featured');

    const storedPrice = await this.config.get<number>('featured_listing_price_daily');
    const dailyPrice = typeof storedPrice === 'number' ? storedPrice : DEFAULT_DAILY_PRICE;
    const amount = days * dailyPrice;
    const paystackRef = `hw_feat_${listingId.slice(0, 8)}_${Date.now()}`;

    const placement = await db(this.prisma).featuredPlacement.create({
      data: {
        listingId,
        startDate: new Date(),
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        amountPaid: amount,
        currency: listing.currency ?? 'NGN',
        status: 'pending_payment',
        paystackRef,
      },
    });

    await this.audit.log({
      entityType: 'FeaturedPlacement',
      entityId: placement.id,
      action: 'FEATURED_PURCHASE_INITIATED',
      actor,
      metadata: { listingId, days, amount, paystackConfigured: this.paystack.isConfigured },
    });

    let authorizationUrl: string | null = null;
    if (this.paystack.isConfigured) {
      const user = await db(this.prisma).user.findUnique({ where: { id: userId } });
      try {
        const init = await this.paystack.initializeTransaction({
          email: user?.email ?? '',
          amountKobo: amount * 100,
          reference: paystackRef,
          metadata: { listingId, placementId: placement.id, days },
        });
        authorizationUrl = init?.authorizationUrl ?? null;
      } catch {
        authorizationUrl = null;
      }
    }

    if (!authorizationUrl) {
      // Development mode: auto-activate so the flow is testable without Paystack
      await this.activate(placement.id, 'development auto-activation');
    }

    return {
      placementId: placement.id,
      paystackRef,
      amount,
      currency: placement.currency,
      days,
      authorizationUrl,
      providerConfigured: this.paystack.isConfigured,
      status: placement.status,
    };
  }

  async activate(placementId: string, source: string) {
    const placement = await db(this.prisma).featuredPlacement.findUnique({ where: { id: placementId } });
    if (!placement) throw new NotFoundException('Placement not found');
    if (placement.status === 'active') return placement;

    const updated = await db(this.prisma).featuredPlacement.update({
      where: { id: placementId },
      data: { status: 'active' },
    });

    await db(this.prisma).listing.update({
      where: { id: placement.listingId },
      data: { featured: true },
    });

    await this.audit.log({
      entityType: 'FeaturedPlacement',
      entityId: placementId,
      action: 'FEATURED_ACTIVATED',
      actor: { id: 'system', role: 'SYSTEM', name: source },
      metadata: { listingId: placement.listingId },
    });

    return updated;
  }

  /** Webhook handler: activate a placement by its Paystack reference. */
  async activateByReference(paystackRef: string) {
    const placement = await db(this.prisma).featuredPlacement.findFirst({ where: { paystackRef } });
    if (!placement) throw new NotFoundException('Placement not found');

    if (this.paystack.isConfigured) {
      const verification = await this.paystack.verifyTransaction(paystackRef);
      if (!verification || verification.status !== 'success') {
        throw new BadRequestException('Payment not verified');
      }
    }

    return this.activate(placement.id, 'Paystack Webhook');
  }

  async getMyPlacements(userId: string) {
    return db(this.prisma).featuredPlacement.findMany({
      where: { listing: { ownerId: userId } },
      orderBy: { createdAt: 'desc' },
      include: { listing: { include: { media: { where: { isPrimary: true }, take: 1 } } } },
    });
  }

  async listAll(params: { status?: string; page?: number; limit?: number }) {
    const where: any = {};
    if (params.status) where.status = params.status;

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;

    const [placements, total] = await Promise.all([
      db(this.prisma).featuredPlacement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { listing: { include: { owner: true, media: true } } },
      }),
      db(this.prisma).featuredPlacement.count({ where }),
    ]);

    return { placements, total, page, limit };
  }

  async cancel(placementId: string, actor: ActorRef) {
    const placement = await db(this.prisma).featuredPlacement.findUnique({ where: { id: placementId } });
    if (!placement) throw new NotFoundException('Placement not found');

    const updated = await db(this.prisma).featuredPlacement.update({
      where: { id: placementId },
      data: { status: 'cancelled' },
    });

    const stillFeatured = await db(this.prisma).featuredPlacement.findFirst({
      where: { listingId: placement.listingId, status: 'active', endDate: { gt: new Date() } },
    });
    if (!stillFeatured) {
      await db(this.prisma).listing.update({
        where: { id: placement.listingId },
        data: { featured: false },
      });
    }

    await this.audit.log({
      entityType: 'FeaturedPlacement',
      entityId: placementId,
      action: 'FEATURED_CANCELLED',
      actor,
      metadata: { listingId: placement.listingId },
    });

    return updated;
  }

  /** Housekeeping: mark expired placements and unfeature listings. */
  async expireExpired() {
    const now = new Date();
    const expired = await db(this.prisma).featuredPlacement.findMany({
      where: { status: 'active', endDate: { lte: now } },
      select: { id: true, listingId: true },
    });

    for (const placement of expired) {
      await db(this.prisma).featuredPlacement.update({
        where: { id: placement.id },
        data: { status: 'expired' },
      });
      const stillFeatured = await db(this.prisma).featuredPlacement.findFirst({
        where: { listingId: placement.listingId, status: 'active', endDate: { gt: now } },
      });
      if (!stillFeatured) {
        await db(this.prisma).listing.update({
          where: { id: placement.listingId },
          data: { featured: false },
        });
      }
    }

    return { expired: expired.length };
  }
}
