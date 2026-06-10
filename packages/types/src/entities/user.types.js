"use strict";
// ─── ENUMS ───────────────────────────────────────────────────
var UserRole;
(function (UserRole) {
    UserRole["GUEST"] = "GUEST";
    UserRole["BUYER"] = "BUYER";
    UserRole["AGENT"] = "AGENT";
    UserRole["DEVELOPER"] = "DEVELOPER";
    UserRole["HOMEOWNER"] = "HOMEOWNER";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (UserRole = {}));
var Permission;
(function (Permission) {
    Permission["LISTING_CREATE"] = "LISTING_CREATE";
    Permission["LISTING_UPDATE_OWN"] = "LISTING_UPDATE_OWN";
    Permission["LISTING_DELETE_OWN"] = "LISTING_DELETE_OWN";
    Permission["LISTING_MODERATE"] = "LISTING_MODERATE";
    Permission["LISTING_FEATURE"] = "LISTING_FEATURE";
    Permission["CRM_VIEW_OWN_CLIENTS"] = "CRM_VIEW_OWN_CLIENTS";
    Permission["CRM_MANAGE_CLIENTS"] = "CRM_MANAGE_CLIENTS";
    Permission["TRANSACTION_CREATE"] = "TRANSACTION_CREATE";
    Permission["TRANSACTION_ADVANCE"] = "TRANSACTION_ADVANCE";
    Permission["TRANSACTION_APPROVE"] = "TRANSACTION_APPROVE";
    Permission["USER_VERIFY"] = "USER_VERIFY";
    Permission["USER_SUSPEND"] = "USER_SUSPEND";
    Permission["AUDIT_LOG_VIEW"] = "AUDIT_LOG_VIEW";
    Permission["AUDIT_LOG_EXPORT"] = "AUDIT_LOG_EXPORT";
    Permission["CONFIG_UPDATE"] = "CONFIG_UPDATE";
    Permission["ANALYTICS_VIEW_OWN"] = "ANALYTICS_VIEW_OWN";
    Permission["ANALYTICS_VIEW_ALL"] = "ANALYTICS_VIEW_ALL";
})(Permission || (Permission = {}));
// ─── ABSTRACT BASE CLASS ───────────────────────────────────
class BaseUser {
    hasPermission(action) { return this.getPermissions().includes(action); }
}
class GuestUser extends BaseUser {
    getPermissions() { return []; }
    toPublicProfile() {
        return { id: this.id, firstName: this.firstName, lastName: this.lastName, role: this.role, verified: this.verified };
    }
}
class Agent extends BaseUser {
    getPermissions() {
        return [Permission.LISTING_CREATE, Permission.LISTING_UPDATE_OWN, Permission.LISTING_DELETE_OWN, Permission.CRM_VIEW_OWN_CLIENTS, Permission.CRM_MANAGE_CLIENTS, Permission.TRANSACTION_CREATE, Permission.TRANSACTION_ADVANCE, Permission.ANALYTICS_VIEW_OWN];
    }
    toPublicProfile() {
        return { id: this.id, firstName: this.firstName, lastName: this.lastName, avatar: this.avatar, role: this.role, rating: this.rating, verified: this.verified };
    }
    getActiveListings() { return this.listings.filter(l => l.status === ListingStatus.ACTIVE); }
    getClosedDeals(_period) { return []; }
}
class Developer extends BaseUser {
    constructor() {
        super(...arguments);
        this.portfolio = [];
    }
    getPermissions() {
        return [Permission.LISTING_CREATE, Permission.LISTING_UPDATE_OWN, Permission.LISTING_DELETE_OWN, Permission.ANALYTICS_VIEW_OWN];
    }
    toPublicProfile() {
        return { id: this.id, firstName: this.firstName, lastName: this.lastName, avatar: this.avatar, role: this.role, verified: this.verified };
    }
}
class Homeowner extends BaseUser {
    constructor() {
        super(...arguments);
        this.properties = [];
    }
    getPermissions() {
        return [Permission.LISTING_CREATE, Permission.LISTING_UPDATE_OWN, Permission.LISTING_DELETE_OWN];
    }
    toPublicProfile() {
        return { id: this.id, firstName: this.firstName, lastName: this.lastName, avatar: this.avatar, role: this.role, verified: this.verified };
    }
}
class BuyerClient extends BaseUser {
    getPermissions() {
        return [Permission.TRANSACTION_CREATE];
    }
    toPublicProfile() {
        return { id: this.id, firstName: this.firstName, lastName: this.lastName, avatar: this.avatar, role: this.role, verified: this.verified };
    }
}
class Admin extends BaseUser {
    getPermissions() {
        return [Permission.LISTING_MODERATE, Permission.LISTING_FEATURE, Permission.USER_VERIFY, Permission.USER_SUSPEND, Permission.TRANSACTION_APPROVE, Permission.AUDIT_LOG_VIEW, Permission.AUDIT_LOG_EXPORT, Permission.CONFIG_UPDATE, Permission.ANALYTICS_VIEW_ALL];
    }
    toPublicProfile() {
        return { id: this.id, firstName: this.firstName, lastName: this.lastName, avatar: this.avatar, role: this.role, verified: this.verified };
    }
}
class SuperAdmin extends Admin {
    getPermissions() {
        return Object.values(Permission);
    }
}
//# sourceMappingURL=user.types.js.map