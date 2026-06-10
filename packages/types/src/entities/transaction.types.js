"use strict";
// ─── ENUMS ───────────────────────────────────────────────────
var TransactionType;
(function (TransactionType) {
    TransactionType["PURCHASE"] = "PURCHASE";
    TransactionType["RENTAL"] = "RENTAL";
    TransactionType["SHORTLET"] = "SHORTLET";
})(TransactionType || (TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["INITIATED"] = "INITIATED";
    TransactionStatus["IN_PROGRESS"] = "IN_PROGRESS";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["REJECTED"] = "REJECTED";
    TransactionStatus["CANCELLED"] = "CANCELLED";
})(TransactionStatus || (TransactionStatus = {}));
// ─── TRANSACTION CLASS ──────────────────────────────────────
class Transaction {
    getCurrentStep() {
        return this.steps.find(s => s.status === 'pending') ?? this.steps[this.steps.length - 1];
    }
    advance(actor, evidence) {
        const current = this.getCurrentStep();
        if (!current)
            return;
        current.status = 'completed';
        current.completedAt = new Date();
        current.completedBy = { id: actor.id, role: actor.role, name: `${actor.firstName} ${actor.lastName}` };
        if (evidence)
            current.evidence = evidence;
    }
    reject(actor, reason) {
        this.status = TransactionStatus.REJECTED;
        const current = this.getCurrentStep();
        if (!current)
            return;
        current.status = 'rejected';
        current.notes = reason;
        current.completedBy = { id: actor.id, role: actor.role, name: `${actor.firstName} ${actor.lastName}` };
    }
    getAuditSummary() {
        return {
            totalEvents: this.auditTrail.length,
            firstEvent: this.auditTrail[0]?.timestamp ?? this.createdAt,
            lastEvent: this.auditTrail[this.auditTrail.length - 1]?.timestamp ?? this.createdAt,
            actors: [...new Set(this.auditTrail.map(e => e.actorName))],
            keyActions: [...new Set(this.auditTrail.map(e => e.action))],
        };
    }
}
//# sourceMappingURL=transaction.types.js.map