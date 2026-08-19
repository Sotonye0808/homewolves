import { Injectable } from '@nestjs/common';
import { and, desc, eq, gte, ilike, lte, count, asc } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { auditEvents } from '../../drizzle/schema';

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
  constructor(private db: DrizzleService) {}

  async log(input: AuditLogInput): Promise<void> {
    await this.db.insert(auditEvents).values({
      entityType: input.entityType,
      entityId: input.entityId,
      action: input.action,
      actorId: input.actor.id,
      actorRole: input.actor.role,
      actorName: input.actor.name,
      ipAddress: input.ipAddress,
      deviceInfo: input.deviceInfo ?? {},
      metadata: input.metadata ?? {},
    });
  }

  async findByEntity(entityType: string, entityId: string): Promise<AuditEvent[]> {
    const events = await this.db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.entityType, entityType), eq(auditEvents.entityId, entityId)))
      .orderBy(asc(auditEvents.timestamp));
    return events as unknown as AuditEvent[];
  }

  async findAllFiltered(filter: AuditFilter) {
    const where = this.buildWhere(filter);

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [events, totalResult] = await Promise.all([
      this.db.select().from(auditEvents).where(where).orderBy(desc(auditEvents.timestamp)).limit(limit).offset(skip),
      this.db.select({ value: count() }).from(auditEvents).where(where),
    ]);

    return { events: events as unknown as AuditEvent[], total: totalResult[0]?.value ?? 0, page, limit };
  }

  async exportCsv(filter: AuditFilter): Promise<string> {
    const where = this.buildWhere(filter);

    const events = await this.db
      .select()
      .from(auditEvents)
      .where(where)
      .orderBy(desc(auditEvents.timestamp))
      .limit(10000);

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

  private buildWhere(filter: AuditFilter) {
    const conditions = [];
    if (filter.entityType) conditions.push(eq(auditEvents.entityType, filter.entityType));
    if (filter.entityId) conditions.push(eq(auditEvents.entityId, filter.entityId));
    if (filter.actorId) conditions.push(eq(auditEvents.actorId, filter.actorId));
    if (filter.action) conditions.push(ilike(auditEvents.action, `%${filter.action}%`));

    if (filter.dateFrom || filter.dateTo) {
      if (filter.dateFrom) conditions.push(gte(auditEvents.timestamp, new Date(filter.dateFrom)));
      if (filter.dateTo) conditions.push(lte(auditEvents.timestamp, new Date(filter.dateTo + 'T23:59:59.999Z')));
    }

    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}
