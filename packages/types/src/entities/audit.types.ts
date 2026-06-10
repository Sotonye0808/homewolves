// ─── ENUMS ───────────────────────────────────────────────────

enum AuditEntityType {
  USER = 'USER',
  LISTING = 'LISTING',
  TRANSACTION = 'TRANSACTION',
  MESSAGE = 'MESSAGE',
  CONFIG = 'CONFIG',
  SUBSCRIPTION = 'SUBSCRIPTION',
}

// ─── INTERFACES ─────────────────────────────────────────────

interface ActorRef {
  id: string;
  role: string;
  name: string;
}

interface AuditSummary {
  totalEvents: number;
  firstEvent: Date;
  lastEvent: Date;
  actors: string[];
  keyActions: string[];
}

// ─── AUDIT EVENT CLASS ──────────────────────────────────────

class AuditEvent {
  id: string;
  entityType: AuditEntityType;
  entityId: string;
  action: string;
  actor: ActorRef;
  actorName: string;
  actorRole: string;
  timestamp: Date;
  ipAddress: string;
  deviceFingerprint: string;
  metadata: Record<string, unknown>;
}
