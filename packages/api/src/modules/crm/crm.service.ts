import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { and, asc, desc, eq, gte, lte, ne, isNull, or, ilike, count, inArray, sql, type SQL } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { ActivityService } from '../activity/activity.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';
import { clients, users, listings, notes, ratings, inspections, messages, conversations } from '../../drizzle/schema';

@Injectable()
export class CrmService {
  constructor(
    private db: DrizzleService,
    private audit: AuditService,
    private activityService: ActivityService,
  ) {}

  // ─── CLIENTS ─────────────────────────────────────────────

  async createClient(dto: CreateClientDto, agentId: string, actor: ActorRef) {
    const [buyer] = await this.db.select().from(users).where(eq(users.id, dto.buyerId));
    if (!buyer) throw new NotFoundException('Buyer not found');

    const [existing] = await this.db
      .select()
      .from(clients)
      .where(and(eq(clients.agentId, agentId), eq(clients.buyerId, dto.buyerId)))
      .limit(1);
    if (existing) throw new BadRequestException('Client already assigned');

    const [client] = await this.db
      .insert(clients)
      .values({
        agentId,
        buyerId: dto.buyerId,
        status: dto.status ?? 'active',
      })
      .returning();
    if (!client) throw new Error('Failed to create client');

    const full = await this.db.query.clients.findFirst({
      where: eq(clients.id, client.id),
      with: { agent: true, buyer: true },
    });

    await this.audit.log({
      entityType: 'Client',
      entityId: client.id,
      action: 'CLIENT_CREATED',
      actor,
      metadata: { buyerId: dto.buyerId },
    });

    this.activityService
      .awardForUser(agentId, actor.role, 'client_added', actor, { clientId: client.id, buyerId: dto.buyerId })
      .catch(() => {});

    return full;
  }

  async getClients(agentId: string, params: { status?: string; search?: string }) {
    const conditions: (SQL | undefined)[] = [eq(clients.agentId, agentId)];
    if (params.status) conditions.push(eq(clients.status, params.status as never));
    if (params.search) {
      conditions.push(
        or(
          ilike(users.firstName, `%${params.search}%`),
          ilike(users.lastName, `%${params.search}%`),
          ilike(users.email, `%${params.search}%`),
        ),
      );
    }

    return this.db
      .select({
        client: {
          id: clients.id,
          agentId: clients.agentId,
          buyerId: clients.buyerId,
          status: clients.status,
          createdAt: clients.createdAt,
          updatedAt: clients.updatedAt,
        },
        buyer: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          role: users.role,
          avatar: users.avatar,
        },
        lastNote: sql<string>`(
          SELECT content FROM notes n WHERE n.client_id = ${clients.id} ORDER BY n.created_at DESC LIMIT 1
        )`,
        inspectionCount: sql<number>`(
          SELECT COUNT(*) FROM inspections i WHERE i.client_id = ${clients.id}
        )`,
      })
      .from(clients)
      .innerJoin(users, eq(clients.buyerId, users.id))
      .where(and(...conditions.filter(Boolean)))
      .orderBy(desc(clients.createdAt));
  }

  async getClientById(id: string, agentId: string) {
    const client = await this.db.query.clients.findFirst({
      where: eq(clients.id, id),
      with: {
        agent: true,
        buyer: true,
        notes: { orderBy: desc(notes.createdAt) },
        ratings: { orderBy: desc(ratings.createdAt) },
        inspections: {
          orderBy: asc(inspections.scheduledAt),
          with: { listing: { with: { media: true } } },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== agentId) throw new ForbiddenException('Not your client');
    return client;
  }

  async updateClient(id: string, dto: UpdateClientDto, agentId: string, actor: ActorRef) {
    const [client] = await this.db.select().from(clients).where(eq(clients.id, id));
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== agentId) throw new ForbiddenException('Not your client');

    const [updated] = await this.db
      .update(clients)
      .set({ status: dto.status })
      .where(eq(clients.id, id))
      .returning();
    if (!updated) throw new Error('Failed to update client');

    const full = await this.db.query.clients.findFirst({
      where: eq(clients.id, updated.id),
      with: { agent: true, buyer: true },
    });

    await this.audit.log({
      entityType: 'Client',
      entityId: id,
      action: 'CLIENT_UPDATED',
      actor,
      metadata: { changes: Object.keys(dto) },
    });

    return full;
  }

  // ─── NOTES ───────────────────────────────────────────────

  async addNote(clientId: string, dto: CreateNoteDto, authorId: string, actor: ActorRef) {
    const [client] = await this.db.select().from(clients).where(eq(clients.id, clientId));
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== authorId) throw new ForbiddenException('Not your client');

    const [note] = await this.db
      .insert(notes)
      .values({ clientId, content: dto.content, authorId })
      .returning();
    if (!note) throw new Error('Failed to create note');

    const full = await this.db.query.notes.findFirst({
      where: eq(notes.id, note.id),
      with: { author: true },
    });

    await this.audit.log({
      entityType: 'Note',
      entityId: note.id,
      action: 'NOTE_CREATED',
      actor,
      metadata: { clientId },
    });

    return full;
  }

  async getNotes(clientId: string, agentId: string) {
    const [client] = await this.db.select().from(clients).where(eq(clients.id, clientId));
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== agentId) throw new ForbiddenException('Not your client');

    return this.db.query.notes.findMany({
      where: eq(notes.clientId, clientId),
      orderBy: desc(notes.createdAt),
      with: { author: true },
    });
  }

  // ─── RATINGS ─────────────────────────────────────────────

  async addRating(clientId: string, dto: CreateRatingDto, authorId: string, actor: ActorRef) {
    if (dto.score < 1 || dto.score > 5) {
      throw new BadRequestException('Score must be between 1 and 5');
    }

    const [client] = await this.db.select().from(clients).where(eq(clients.id, clientId));
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== authorId) throw new ForbiddenException('Not your client');

    const [rating] = await this.db
      .insert(ratings)
      .values({
        clientId,
        score: dto.score,
        review: dto.review,
        authorId,
      })
      .returning();
    if (!rating) throw new Error('Failed to create rating');

    const full = await this.db.query.ratings.findFirst({
      where: eq(ratings.id, rating.id),
      with: { author: true },
    });

    await this.audit.log({
      entityType: 'Rating',
      entityId: rating.id,
      action: 'RATING_CREATED',
      actor,
      metadata: { clientId, score: dto.score },
    });

    if (dto.score >= 5) {
      this.activityService
        .awardForUser(client.agentId, actor.role, 'review_received', actor, { clientId, ratingId: rating.id })
        .catch(() => {});
    }

    return full;
  }

  async getRatings(clientId: string, agentId: string) {
    const [client] = await this.db.select().from(clients).where(eq(clients.id, clientId));
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== agentId) throw new ForbiddenException('Not your client');

    return this.db.query.ratings.findMany({
      where: eq(ratings.clientId, clientId),
      orderBy: desc(ratings.createdAt),
      with: { author: true },
    });
  }

  // ─── INSPECTIONS ─────────────────────────────────────────

  async createInspection(dto: CreateInspectionDto, authorId: string, actor: ActorRef) {
    const [client] = await this.db.select().from(clients).where(eq(clients.id, dto.clientId));
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== authorId) throw new ForbiddenException('Not your client');

    const [listing] = await this.db.select().from(listings).where(eq(listings.id, dto.listingId));
    if (!listing) throw new NotFoundException('Listing not found');

    const [inspection] = await this.db
      .insert(inspections)
      .values({
        clientId: dto.clientId,
        listingId: dto.listingId,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes,
        authorId,
      })
      .returning();
    if (!inspection) throw new Error('Failed to create inspection');

    const full = await this.db.query.inspections.findFirst({
      where: eq(inspections.id, inspection.id),
      with: {
        client: { with: { buyer: true } },
        listing: { with: { media: true } },
      },
    });

    await this.audit.log({
      entityType: 'Inspection',
      entityId: inspection.id,
      action: 'INSPECTION_CREATED',
      actor,
      metadata: { clientId: dto.clientId, listingId: dto.listingId, scheduledAt: dto.scheduledAt },
    });

    this.activityService
      .awardForUser(authorId, actor.role, 'inspection_scheduled', actor, { inspectionId: inspection.id, clientId: dto.clientId })
      .catch(() => {});

    return full;
  }

  async getInspections(agentId: string, date?: string) {
    const agentClients = await this.db.select({ id: clients.id }).from(clients).where(eq(clients.agentId, agentId));
    const clientIds = agentClients.map((c) => c.id);
    if (clientIds.length === 0) return [];

    const conditions = [inArray(inspections.clientId, clientIds)];
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      conditions.push(gte(inspections.scheduledAt, start), lte(inspections.scheduledAt, end));
    }

    return this.db.query.inspections.findMany({
      where: and(...conditions),
      orderBy: asc(inspections.scheduledAt),
      with: {
        client: { with: { buyer: true } },
        listing: { with: { media: true } },
      },
    });
  }

  async updateInspection(id: string, dto: UpdateInspectionDto, agentId: string, actor: ActorRef) {
    const inspection = await this.db.query.inspections.findFirst({
      where: eq(inspections.id, id),
      with: { client: true },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    if (inspection.client.agentId !== agentId) throw new ForbiddenException('Not your inspection');

    const set: Partial<typeof inspections.$inferInsert> = {};
    if (dto.status) set.status = dto.status;
    if (dto.scheduledAt) set.scheduledAt = new Date(dto.scheduledAt);
    if (dto.notes) set.notes = dto.notes;

    await this.db.update(inspections).set(set).where(eq(inspections.id, id));

    const updated = await this.db.query.inspections.findFirst({
      where: eq(inspections.id, id),
      with: {
        client: { with: { buyer: true } },
        listing: { with: { media: true } },
      },
    });

    await this.audit.log({
      entityType: 'Inspection',
      entityId: id,
      action: `INSPECTION_${dto.status ?? 'UPDATED'}`,
      actor,
      metadata: { changes: Object.keys(dto) },
    });

    return updated;
  }

  // ─── DASHBOARD STATS ─────────────────────────────────────

  async getDashboardStats(agentId: string) {
    const todayStart = new Date(new Date().setHours(0, 0, 0, 0));
    const todayEnd = new Date(new Date().setHours(23, 59, 59, 999));
    const monthStart = new Date(new Date().setDate(1));

    const [activeClients, newThisMonth, pendingClients, todayInspections, unreadMessages] = await Promise.all([
      this.db
        .select({ value: count() })
        .from(clients)
        .where(and(eq(clients.agentId, agentId), eq(clients.status, 'active')))
        .then((r) => r[0]?.value ?? 0),
      this.db
        .select({ value: count() })
        .from(clients)
        .where(and(eq(clients.agentId, agentId), gte(clients.createdAt, monthStart)))
        .then((r) => r[0]?.value ?? 0),
      this.db
        .select({ value: count() })
        .from(clients)
        .where(and(eq(clients.agentId, agentId), eq(clients.status, 'pending')))
        .then((r) => r[0]?.value ?? 0),
      this.db
        .select({ value: count() })
        .from(inspections)
        .innerJoin(clients, eq(inspections.clientId, clients.id))
        .where(and(eq(clients.agentId, agentId), gte(inspections.scheduledAt, todayStart), lte(inspections.scheduledAt, todayEnd)))
        .then((r) => r[0]?.value ?? 0),
      this.db
        .select({ value: count() })
        .from(messages)
        .innerJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(
          and(
            sql`${conversations.participantIds} @> ARRAY[${agentId}]`,
            ne(messages.senderId, agentId),
            isNull(messages.readAt),
          ),
        )
        .then((r) => r[0]?.value ?? 0),
    ]);

    return {
      activeClients,
      newThisMonth,
      pendingClients,
      todayInspections,
      unreadMessages,
    };
  }

  async getRecentClients(agentId: string, limit = 5) {
    return this.db.query.clients.findMany({
      where: eq(clients.agentId, agentId),
      orderBy: desc(clients.updatedAt),
      limit,
      with: { buyer: true },
    });
  }
}
