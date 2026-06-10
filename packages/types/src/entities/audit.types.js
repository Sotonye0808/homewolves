"use strict";
// ─── ENUMS ───────────────────────────────────────────────────
var AuditEntityType;
(function (AuditEntityType) {
    AuditEntityType["USER"] = "USER";
    AuditEntityType["LISTING"] = "LISTING";
    AuditEntityType["TRANSACTION"] = "TRANSACTION";
    AuditEntityType["MESSAGE"] = "MESSAGE";
    AuditEntityType["CONFIG"] = "CONFIG";
    AuditEntityType["SUBSCRIPTION"] = "SUBSCRIPTION";
})(AuditEntityType || (AuditEntityType = {}));
// ─── AUDIT EVENT CLASS ──────────────────────────────────────
class AuditEvent {
}
//# sourceMappingURL=audit.types.js.map