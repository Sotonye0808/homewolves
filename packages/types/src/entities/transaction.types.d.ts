declare enum TransactionType {
    PURCHASE = "PURCHASE",
    RENTAL = "RENTAL",
    SHORTLET = "SHORTLET"
}
declare enum TransactionStatus {
    INITIATED = "INITIATED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    REJECTED = "REJECTED",
    CANCELLED = "CANCELLED"
}
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
declare class Transaction {
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
    getCurrentStep(): TransactionStep | undefined;
    advance(actor: BaseUser, evidence?: Evidence): void;
    reject(actor: Admin, reason: string): void;
    getAuditSummary(): AuditSummary;
}
//# sourceMappingURL=transaction.types.d.ts.map