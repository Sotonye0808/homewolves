// ─── ENUMS ───────────────────────────────────────────────────

enum TransactionType {
  PURCHASE = 'PURCHASE',
  RENTAL = 'RENTAL',
  SHORTLET = 'SHORTLET',
}

enum TransactionStatus {
  INITIATED = 'INITIATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

// ─── INTERFACES ─────────────────────────────────────────────

interface TransactionStep {
  id: string;
  label: string;
  order: number;
  status: 'pending' | 'completed' | 'rejected';
  completedAt?: Date;
  completedBy?: ActorRef;
  evidence?: Evidence;
  notes?: string;
}

interface TransactionDocument {
  id: string;
  transactionId: string;
  name: string;
  type: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
}

interface PaymentRecord {
  id: string;
  transactionId: string;
  amount: Money;
  type: 'deposit' | 'installment' | 'commission' | 'final';
  status: 'pending' | 'confirmed' | 'rejected';
  evidenceUrl?: string;
  confirmedBy?: string;
  confirmedAt?: Date;
  createdAt: Date;
}

interface Evidence {
  type: 'document' | 'image' | 'receipt' | 'screenshot';
  url: string;
  notes?: string;
  uploadedAt: Date;
}

interface AuditSummary {
  totalEvents: number;
  firstEvent: Date;
  lastEvent: Date;
  actors: string[];
  keyActions: string[];
}

// ─── TRANSACTION CLASS ──────────────────────────────────────

class Transaction {
  id: string;
  listing: Listing;
  buyer: BuyerClient;
  agent: Agent;
  type: TransactionType;
  status: TransactionStatus;
  steps: TransactionStep[];
  documents: TransactionDocument[];
  payments: PaymentRecord[];
  auditTrail: AuditEvent[];
  createdAt: Date;

  getCurrentStep(): TransactionStep | undefined {
    return this.steps.find(s => s.status === 'pending') ?? this.steps[this.steps.length - 1];
  }

  advance(actor: BaseUser, evidence?: Evidence): void {
    const current = this.getCurrentStep();
    if (!current) return;
    current.status = 'completed';
    current.completedAt = new Date();
    current.completedBy = { id: actor.id, role: actor.role, name: `${actor.firstName} ${actor.lastName}` };
    if (evidence) current.evidence = evidence;
  }

  reject(actor: Admin, reason: string): void {
    this.status = TransactionStatus.REJECTED;
    const current = this.getCurrentStep();
    if (!current) return;
    current.status = 'rejected';
    current.notes = reason;
    current.completedBy = { id: actor.id, role: actor.role, name: `${actor.firstName} ${actor.lastName}` };
  }

  getAuditSummary(): AuditSummary {
    return {
      totalEvents: this.auditTrail.length,
      firstEvent: this.auditTrail[0]?.timestamp ?? this.createdAt,
      lastEvent: this.auditTrail[this.auditTrail.length - 1]?.timestamp ?? this.createdAt,
      actors: [...new Set(this.auditTrail.map(e => e.actorName))],
      keyActions: [...new Set(this.auditTrail.map(e => e.action))],
    };
  }
}
