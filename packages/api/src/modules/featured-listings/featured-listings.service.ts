import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { and, desc, eq, gt, lte, count, inArray } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { PaystackClient } from '../../common/integrations/paystack.client';
import { PlatformConfigService } from '../platform-config/platform-config.service';
import { listings, users, featuredPlacements, media } from '../../drizzle/schema';

const DEFAULT_DAILY_PRICE = 5000; // NGN per day, overridable via platform config

@Injectable()
export class FeaturedListingsService {
  constructor(
    private db: DrizzleService,
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
    const placements = await this.db.query.featuredPlacements.findMany({
      where: and(eq(featuredPlacements.status, 'active'), gt(featuredPlacements.endDate, now)),
      orderBy: desc(featuredPlacements.startDate),
      limit: take,
      with: { listing: { with: { owner: true, media: true } } },
    });
    return placements.map((p) => ({ placement: { id: p.id, startDate: p.startDate, endDate: p.endDate }, listing: p.listing }));
  }

  async purchase(listingId: string, userId: string, days: number, actor: ActorRef) {
    if (!Number.isInteger(days) || days < 1 || days > 90) {
      throw new BadRequestException('days must be between 1 and 90');
    }

    const [listing] = await this.db.select().from(listings).where(eq(listings.id, listingId));
    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.ownerId !== userId) throw new ForbiddenException('Not your listing');

    const [existing] = await this.db
      .select()
      .from(featuredPlacements)
      .where(and(eq(featuredPlacements.listingId, listingId), eq(featuredPlacements.status, 'active'), gt(featuredPlacements.endDate, new Date())))
      .limit(1);
    if (existing) throw new BadRequestException('Listing is already featured');

    const storedPrice = await this.config.get<number>('featured_listing_price_daily');
    const dailyPrice = typeof storedPrice === 'number' ? storedPrice : DEFAULT_DAILY_PRICE;
    const amount = days * dailyPrice;
    const paystackRef = `hw_feat_${listingId.slice(0, 8)}_${Date.now()}`;

    const [placement] = await this.db
      .insert(featuredPlacements)
      .values({
        listingId,
        startDate: new Date(),
        endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
        amountPaid: String(amount),
        currency: listing.currency ?? 'NGN',
        status: 'pending_payment',
        paystackRef,
      })
      .returning();
    if (!placement) throw new Error('Failed to create placement');

    await this.audit.log({
      entityType: 'FeaturedPlacement',
      entityId: placement.id,
      action: 'FEATURED_PURCHASE_INITIATED',
      actor,
      metadata: { listingId, days, amount, paystackConfigured: this.paystack.isConfigured },
    });

    let authorizationUrl: string | null = null;
    if (this.paystack.isConfigured) {
      const [user] = await this.db.select().from(users).where(eq(users.id, userId));
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
    const [placement] = await this.db.select().from(featuredPlacements).where(eq(featuredPlacements.id, placementId));
    if (!placement) throw new NotFoundException('Placement not found');
    if (placement.status === 'active') return placement;

    const [updated] = await this.db
      .update(featuredPlacements)
      .set({ status: 'active' })
      .where(eq(featuredPlacements.id, placementId))
      .returning();

    await this.db.update(listings).set({ featured: true }).where(eq(listings.id, placement.listingId));

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
    const [placement] = await this.db.select().from(featuredPlacements).where(eq(featuredPlacements.paystackRef, paystackRef));
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
    const agentListings = await this.db.select({ id: listings.id }).from(listings).where(eq(listings.ownerId, userId));
    const listingIds = agentListings.map((l) => l.id);
    if (listingIds.length === 0) return [];

    return this.db.query.featuredPlacements.findMany({
      where: inArray(featuredPlacements.listingId, listingIds),
      orderBy: desc(featuredPlacements.createdAt),
      with: {
        listing: { with: { media: { where: eq(media.isPrimary, true), limit: 1 } } },
      },
    });
  }

  async listAll(params: { status?: string; page?: number; limit?: number }) {
    const conditions = [];
    if (params.status) conditions.push(eq(featuredPlacements.status, params.status as never));

    const page = params.page ?? 1;
    const limit = params.limit ?? 20;
    const skip = (page - 1) * limit;
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [placements, total] = await Promise.all([
      this.db.query.featuredPlacements.findMany({
        where,
        offset: skip,
        limit,
        orderBy: desc(featuredPlacements.createdAt),
        with: { listing: { with: { owner: true, media: true } } },
      }),
      this.db.select({ value: count() }).from(featuredPlacements).where(where),
    ]);

    return { placements, total: total[0]?.value ?? 0, page, limit };
  }

  async cancel(placementId: string, actor: ActorRef) {
    const [placement] = await this.db.select().from(featuredPlacements).where(eq(featuredPlacements.id, placementId));
    if (!placement) throw new NotFoundException('Placement not found');

    const [updated] = await this.db
      .update(featuredPlacements)
      .set({ status: 'cancelled' })
      .where(eq(featuredPlacements.id, placementId))
      .returning();

    const [stillFeatured] = await this.db
      .select()
      .from(featuredPlacements)
      .where(and(eq(featuredPlacements.listingId, placement.listingId), eq(featuredPlacements.status, 'active'), gt(featuredPlacements.endDate, new Date())))
      .limit(1);
    if (!stillFeatured) {
      await this.db.update(listings).set({ featured: false }).where(eq(listings.id, placement.listingId));
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
    const expired = await this.db
      .select({ id: featuredPlacements.id, listingId: featuredPlacements.listingId })
      .from(featuredPlacements)
      .where(and(eq(featuredPlacements.status, 'active'), lte(featuredPlacements.endDate, now)));

    for (const placement of expired) {
      await this.db.update(featuredPlacements).set({ status: 'expired' }).where(eq(featuredPlacements.id, placement.id));
      const [stillFeatured] = await this.db
        .select()
        .from(featuredPlacements)
        .where(and(eq(featuredPlacements.listingId, placement.listingId), eq(featuredPlacements.status, 'active'), gt(featuredPlacements.endDate, now)))
        .limit(1);
      if (!stillFeatured) {
        await this.db.update(listings).set({ featured: false }).where(eq(listings.id, placement.listingId));
      }
    }

    return { expired: expired.length };
  }
}