import { Injectable, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const db = (prisma: PrismaService) => prisma;

interface TrackEventInput {
  event: string;
  userId?: string;
  sessionId?: string;
  listingId?: string;
  agentId?: string;
  metadata?: Record<string, unknown>;
}

const FUNNEL_EVENTS = [
  'pageview',
  'listing_view',
  'listing_enquiry',
  'listing_saved',
  'transaction_started',
  'transaction_completed',
];

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async track(input: TrackEventInput) {
    const event = await db(this.prisma).analyticsEvent.create({
      data: {
        event: input.event,
        userId: input.userId ?? null,
        sessionId: input.sessionId ?? null,
        listingId: input.listingId ?? null,
        agentId: input.agentId ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
    return { id: event.id, event: event.event };
  }

  private dateRange(days?: number): { from: Date; to: Date } {
    const to = new Date();
    const from = new Date();
    if (days && days > 0) {
      from.setDate(from.getDate() - days);
    } else {
      from.setFullYear(from.getFullYear() - 100);
    }
    return { from, to };
  }

  async getListingPerformance(listingId: string, days?: number) {
    const { from, to } = this.dateRange(days);

    const [listing, eventGroups] = await Promise.all([
      db(this.prisma).listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          title: true,
          viewCount: true,
          enquiryCount: true,
          featured: true,
          status: true,
          createdAt: true,
        },
      }),
      db(this.prisma).analyticsEvent.groupBy({
        by: ['event'],
        where: { listingId, createdAt: { gte: from, lte: to } },
        _count: true,
      }),
    ]);

    if (!listing) {
      return { error: 'Listing not found' };
    }

    const eventCounts = eventGroups.reduce(
      (acc, g) => {
        acc[g.event] = g._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      listing,
      period: { from, to },
      events: eventCounts,
      totalEvents: eventGroups.reduce((sum, g) => sum + g._count, 0),
    };
  }

  async getAgentPerformance(agentId: string, days?: number) {
    const { from, to } = this.dateRange(days);

    const [listings, transactions, eventGroups, points, agent] = await Promise.all([
      db(this.prisma).listing.findMany({
        where: { agentId },
        select: {
          id: true,
          title: true,
          viewCount: true,
          enquiryCount: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 500,
      }),
      db(this.prisma).transaction.findMany({
        where: { agentId },
        select: { status: true },
      }),
      db(this.prisma).analyticsEvent.groupBy({
        by: ['event'],
        where: { agentId, createdAt: { gte: from, lte: to } },
        _count: true,
      }),
      db(this.prisma).agentPoints.findUnique({ where: { agentId } }),
      db(this.prisma).user.findUnique({
        where: { id: agentId },
        select: { id: true, firstName: true, lastName: true, email: true },
      }),
    ]);

    const eventCounts = eventGroups.reduce(
      (acc, g) => {
        acc[g.event] = g._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    const statusBreakdown = transactions.reduce(
      (acc, t) => {
        acc[t.status] = (acc[t.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      agent,
      period: { from, to },
      summary: {
        activeListings: listings.filter((l) => l.status === 'ACTIVE').length,
        totalListings: listings.length,
        totalViews: listings.reduce((sum, l) => sum + l.viewCount, 0),
        totalEnquiries: listings.reduce((sum, l) => sum + l.enquiryCount, 0),
        transactions: statusBreakdown,
        totalTransactions: transactions.length,
        activityPoints: points?.totalPoints ?? 0,
        tier: points?.tier ?? 'bronze',
      },
      listings: listings.slice(0, 20),
      events: eventCounts,
    };
  }

  async getFunnel(days?: number) {
    const { from, to } = this.dateRange(days);

    const groups = await db(this.prisma).analyticsEvent.groupBy({
      by: ['event'],
      where: { createdAt: { gte: from, lte: to } },
      _count: true,
    });

    const counts = groups.reduce(
      (acc, g) => {
        acc[g.event] = g._count;
        return acc;
      },
      {} as Record<string, number>,
    );

    return FUNNEL_EVENTS.map((event, i) => {
      const stepCount = counts[event] ?? 0;
      const previous = i === 0 ? null : counts[FUNNEL_EVENTS[i - 1]!] ?? 0;
      return {
        event,
        count: stepCount,
        conversionRate: previous && previous > 0 ? Number(((stepCount / previous) * 100).toFixed(1)) : (i === 0 ? 100 : 0),
      };
    });
  }

  async getOverview(days?: number) {
    const { from, to } = this.dateRange(days);

    const [events, listingsCreated, transactions, users] = await Promise.all([
      db(this.prisma).analyticsEvent.groupBy({
        by: ['event'],
        where: { createdAt: { gte: from, lte: to } },
        _count: true,
      }),
      db(this.prisma).listing.count({ where: { createdAt: { gte: from, lte: to } } }),
      db(this.prisma).transaction.count({ where: { createdAt: { gte: from, lte: to } } }),
      db(this.prisma).user.count({ where: { createdAt: { gte: from, lte: to } } }),
    ]);

    const totalEvents = events.reduce((sum, g) => sum + g._count, 0);

    return {
      period: { from, to },
      totalEvents,
      events: events.reduce((acc, g) => {
        acc[g.event] = g._count;
        return acc;
      }, {} as Record<string, number>),
      listingsCreated,
      transactionsStarted: transactions,
      newUsers: users,
    };
  }

  async getMyPerformance(userId: string, role: string, days?: number) {
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      return this.getOverview(days);
    }
    if (role === 'AGENT' || role === 'DEVELOPER' || role === 'HOMEOWNER') {
      return this.getAgentPerformance(userId, days);
    }
    throw new ForbiddenException('Analytics are available to agents and admins');
  }

  async getTopListings(days?: number, limit = 10) {
    const { from, to } = this.dateRange(days);

    const groups = await db(this.prisma).analyticsEvent.groupBy({
      by: ['listingId'],
      where: {
        listingId: { not: null },
        createdAt: { gte: from, lte: to },
      },
      _count: true,
      orderBy: { _count: { listingId: 'desc' } },
      take: limit,
    });

    const ids = groups.map((g) => g.listingId).filter((id): id is string => Boolean(id));
    if (ids.length === 0) return [];

    const listings = await db(this.prisma).listing.findMany({
      where: { id: { in: ids } },
      include: { media: { where: { isPrimary: true }, take: 1 } },
    });
    const byId = Object.fromEntries(listings.map((l) => [l.id, l]));

    return groups
      .map((g) => ({
        listing: byId[g.listingId as string] ?? null,
        events: g._count,
      }))
      .filter((item) => item.listing != null);
  }
}
