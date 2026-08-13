import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

interface AuditLogInput {
  entityType: string;
  entityId: string;
  action: string;
  actor: ActorRef;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  deviceInfo?: Record<string, unknown>;
}

interface AuditFilter {
  entityType?: string;
  entityId?: string;
  actorId?: string;
  action?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.prisma.auditEvent.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        actorId: input.actor.id,
        actorRole: input.actor.role,
        actorName: input.actor.name,
        ipAddress: input.ipAddress,
        deviceInfo: (input.deviceInfo ?? {}) as Prisma.InputJsonValue,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditEvent[]> {
    const events = await this.prisma.auditEvent.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: 'asc' },
    });
    return events as unknown as AuditEvent[];
  }

  async findAllFiltered(filter: AuditFilter) {
    const where: Prisma.AuditEventWhereInput = {};

    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.actorId) where.actorId = filter.actorId;
    if (filter.action) where.action = { contains: filter.action, mode: 'insensitive' };

    if (filter.dateFrom || filter.dateTo) {
      where.timestamp = {};
      if (filter.dateFrom) where.timestamp.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.timestamp.lte = new Date(filter.dateTo + 'T23:59:59.999Z');
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [events, total] = await Promise.all([
      this.prisma.auditEvent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.prisma.auditEvent.count({ where }),
    ]);

    return { events: events as unknown as AuditEvent[], total, page, limit };
  }

  async exportCsv(filter: AuditFilter): Promise<string> {
    const where: Prisma.AuditEventWhereInput = {};
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.actorId) where.actorId = filter.actorId;
    if (filter.action) where.action = { contains: filter.action, mode: 'insensitive' };

    if (filter.dateFrom || filter.dateTo) {
      where.timestamp = {};
      if (filter.dateFrom) where.timestamp.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.timestamp.lte = new Date(filter.dateTo + 'T23:59:59.999Z');
    }

    const events = await this.prisma.auditEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10000,
    });

    const headers = 'Timestamp,Actor,Actor Role,Action,Entity Type,Entity ID,IP Address\n';
    const rows = events
      .map(
        (e) =>
          `"${e.timestamp.toISOString()}","${e.actorName}","${e.actorRole}","${e.action}","${e.entityType}","${e.entityId}","${e.ipAddress ?? ''}"`,
      )
      .join('\n');

    return headers + rows;
  }

  async exportPdf(filter: AuditFilter): Promise<{ html: string }> {
    const result = await this.findAllFiltered(filter);
    const rows = result.events
      .map(
        (e) => `
      <tr>
        <td>${new Date(e.timestamp).toLocaleString()}</td>
        <td>${e.actorName} (${e.actorRole})</td>
        <td>${e.action}</td>
        <td>${e.entityType}</td>
      </tr>
    `,
      )
      .join('');

    const html = `
      <html><head><style>
        body { font-family: Inter, sans-serif; padding: 40px; }
        h1 { color: #1A3A5C; font-family: 'DM Serif Display', serif; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { text-align: left; padding: 8px 12px; background: #F7F6F3; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; }
        td { padding: 8px 12px; border-bottom: 1px solid rgba(0,0,0,0.06); font-size: 14px; }
      </style></head><body>
        <h1>Audit Log Export</h1>
        <p>Generated: ${new Date().toISOString()}</p>
        <table><thead><tr><th>Timestamp</th><th>Actor</th><th>Action</th><th>Entity</th></tr></thead><tbody>${rows}</tbody></table>
      </body></html>`;

    return { html };
  }
}
