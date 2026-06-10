import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { CreateNoteDto } from './dto/create-note.dto';
import { CreateRatingDto } from './dto/create-rating.dto';
import { CreateInspectionDto } from './dto/create-inspection.dto';
import { UpdateInspectionDto } from './dto/update-inspection.dto';

const db = (prisma: PrismaService) => prisma as any;

@Injectable()
export class CrmService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ─── CLIENTS ─────────────────────────────────────────────

  async createClient(dto: CreateClientDto, agentId: string, actor: ActorRef) {
    const buyer = await db(this.prisma).user.findUnique({ where: { id: dto.buyerId } });
    if (!buyer) throw new NotFoundException('Buyer not found');

    const existing = await db(this.prisma).client.findFirst({
      where: { agentId, buyerId: dto.buyerId },
    });
    if (existing) throw new BadRequestException('Client already assigned');

    const client = await db(this.prisma).client.create({
      data: {
        agentId,
        buyerId: dto.buyerId,
        status: dto.status ?? 'active',
      },
      include: { agent: true, buyer: true },
    });

    await this.audit.log({
      entityType: 'Client',
      entityId: client.id,
      action: 'CLIENT_CREATED',
      actor,
      metadata: { buyerId: dto.buyerId },
    });

    return client;
  }

  async getClients(agentId: string, params: { status?: string; search?: string }) {
    const where: any = { agentId };
    if (params.status) where.status = params.status;
    if (params.search) {
      where.buyer = {
        OR: [
          { firstName: { contains: params.search, mode: 'insensitive' } },
          { lastName: { contains: params.search, mode: 'insensitive' } },
          { email: { contains: params.search, mode: 'insensitive' } },
        ],
      };
    }

    const clients = await db(this.prisma).client.findMany({
      where,
      include: {
        buyer: true,
        notes: { orderBy: { createdAt: 'desc' }, take: 1 },
        ratings: true,
        inspections: { orderBy: { scheduledAt: 'asc' }, take: 5 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return clients;
  }

  async getClientById(id: string, agentId: string) {
    const client = await db(this.prisma).client.findUnique({
      where: { id },
      include: {
        agent: true,
        buyer: true,
        notes: { orderBy: { createdAt: 'desc' } },
        ratings: { orderBy: { createdAt: 'desc' } },
        inspections: {
          include: { listing: { include: { media: true } } },
          orderBy: { scheduledAt: 'asc' },
        },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== agentId) throw new ForbiddenException('Not your client');
    return client;
  }

  async updateClient(id: string, dto: UpdateClientDto, agentId: string, actor: ActorRef) {
    const client = await db(this.prisma).client.findUnique({ where: { id } });
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== agentId) throw new ForbiddenException('Not your client');

    const updated = await db(this.prisma).client.update({
      where: { id },
      data: { status: dto.status },
      include: { agent: true, buyer: true },
    });

    await this.audit.log({
      entityType: 'Client',
      entityId: id,
      action: 'CLIENT_UPDATED',
      actor,
      metadata: { changes: Object.keys(dto) },
    });

    return updated;
  }

  // ─── NOTES ───────────────────────────────────────────────

  async addNote(clientId: string, dto: CreateNoteDto, authorId: string, actor: ActorRef) {
    const client = await db(this.prisma).client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== authorId) throw new ForbiddenException('Not your client');

    const note = await db(this.prisma).note.create({
      data: { clientId, content: dto.content, authorId },
      include: { author: true },
    });

    await this.audit.log({
      entityType: 'Note',
      entityId: note.id,
      action: 'NOTE_CREATED',
      actor,
      metadata: { clientId },
    });

    return note;
  }

  async getNotes(clientId: string, agentId: string) {
    const client = await db(this.prisma).client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== agentId) throw new ForbiddenException('Not your client');

    return db(this.prisma).note.findMany({
      where: { clientId },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── RATINGS ─────────────────────────────────────────────

  async addRating(clientId: string, dto: CreateRatingDto, authorId: string, actor: ActorRef) {
    if (dto.score < 1 || dto.score > 5) {
      throw new BadRequestException('Score must be between 1 and 5');
    }

    const client = await db(this.prisma).client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== authorId) throw new ForbiddenException('Not your client');

    const rating = await db(this.prisma).rating.create({
      data: {
        clientId,
        score: dto.score,
        review: dto.review,
        authorId,
      },
      include: { author: true },
    });

    await this.audit.log({
      entityType: 'Rating',
      entityId: rating.id,
      action: 'RATING_CREATED',
      actor,
      metadata: { clientId, score: dto.score },
    });

    return rating;
  }

  async getRatings(clientId: string, agentId: string) {
    const client = await db(this.prisma).client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== agentId) throw new ForbiddenException('Not your client');

    return db(this.prisma).rating.findMany({
      where: { clientId },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── INSPECTIONS ─────────────────────────────────────────

  async createInspection(dto: CreateInspectionDto, authorId: string, actor: ActorRef) {
    const client = await db(this.prisma).client.findUnique({ where: { id: dto.clientId } });
    if (!client) throw new NotFoundException('Client not found');
    if (client.agentId !== authorId) throw new ForbiddenException('Not your client');

    const listing = await db(this.prisma).listing.findUnique({ where: { id: dto.listingId } });
    if (!listing) throw new NotFoundException('Listing not found');

    const inspection = await db(this.prisma).inspection.create({
      data: {
        clientId: dto.clientId,
        listingId: dto.listingId,
        scheduledAt: new Date(dto.scheduledAt),
        notes: dto.notes,
        authorId,
      },
      include: {
        client: { include: { buyer: true } },
        listing: { include: { media: true } },
      },
    });

    await this.audit.log({
      entityType: 'Inspection',
      entityId: inspection.id,
      action: 'INSPECTION_CREATED',
      actor,
      metadata: { clientId: dto.clientId, listingId: dto.listingId, scheduledAt: dto.scheduledAt },
    });

    return inspection;
  }

  async getInspections(agentId: string, date?: string) {
    const where: any = {
      client: { agentId },
    };
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      where.scheduledAt = { gte: start, lte: end };
    }

    return db(this.prisma).inspection.findMany({
      where,
      include: {
        client: { include: { buyer: true } },
        listing: { include: { media: true } },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async updateInspection(id: string, dto: UpdateInspectionDto, agentId: string, actor: ActorRef) {
    const inspection = await db(this.prisma).inspection.findUnique({
      where: { id },
      include: { client: true },
    });
    if (!inspection) throw new NotFoundException('Inspection not found');
    if (inspection.client.agentId !== agentId) throw new ForbiddenException('Not your inspection');

    const data: any = {};
    if (dto.status) data.status = dto.status;
    if (dto.scheduledAt) data.scheduledAt = new Date(dto.scheduledAt);
    if (dto.notes) data.notes = dto.notes;

    const updated = await db(this.prisma).inspection.update({
      where: { id },
      data,
      include: {
        client: { include: { buyer: true } },
        listing: { include: { media: true } },
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
    const [activeClients, newThisMonth, pendingClients, todayInspections, unreadMessages] =
      await Promise.all([
        db(this.prisma).client.count({ where: { agentId, status: 'active' } }),
        db(this.prisma).client.count({
          where: {
            agentId,
            createdAt: { gte: new Date(new Date().setDate(1)) },
          },
        }),
        db(this.prisma).client.count({ where: { agentId, status: 'pending' } }),
        db(this.prisma).inspection.count({
          where: {
            client: { agentId },
            scheduledAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
              lte: new Date(new Date().setHours(23, 59, 59, 999)),
            },
          },
        }),
        db(this.prisma).message.count({
          where: {
            conversation: {
              participantIds: { has: agentId },
            },
            readAt: null,
            senderId: { not: agentId },
          },
        }),
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
    return db(this.prisma).client.findMany({
      where: { agentId },
      include: { buyer: true },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
  }
}
