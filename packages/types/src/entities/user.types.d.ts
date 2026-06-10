declare enum UserRole {
    GUEST = "GUEST",
    BUYER = "BUYER",
    AGENT = "AGENT",
    DEVELOPER = "DEVELOPER",
    HOMEOWNER = "HOMEOWNER",
    ADMIN = "ADMIN",
    SUPER_ADMIN = "SUPER_ADMIN"
}
declare enum Permission {
    LISTING_CREATE = "LISTING_CREATE",
    LISTING_UPDATE_OWN = "LISTING_UPDATE_OWN",
    LISTING_DELETE_OWN = "LISTING_DELETE_OWN",
    LISTING_MODERATE = "LISTING_MODERATE",
    LISTING_FEATURE = "LISTING_FEATURE",
    CRM_VIEW_OWN_CLIENTS = "CRM_VIEW_OWN_CLIENTS",
    CRM_MANAGE_CLIENTS = "CRM_MANAGE_CLIENTS",
    TRANSACTION_CREATE = "TRANSACTION_CREATE",
    TRANSACTION_ADVANCE = "TRANSACTION_ADVANCE",
    TRANSACTION_APPROVE = "TRANSACTION_APPROVE",
    USER_VERIFY = "USER_VERIFY",
    USER_SUSPEND = "USER_SUSPEND",
    AUDIT_LOG_VIEW = "AUDIT_LOG_VIEW",
    AUDIT_LOG_EXPORT = "AUDIT_LOG_EXPORT",
    CONFIG_UPDATE = "CONFIG_UPDATE",
    ANALYTICS_VIEW_OWN = "ANALYTICS_VIEW_OWN",
    ANALYTICS_VIEW_ALL = "ANALYTICS_VIEW_ALL"
}
interface UserPreferences {
    theme: 'light' | 'dark' | 'high-contrast' | 'system';
    notifications: {
        email: boolean;
        sms: boolean;
        push: boolean;
        whatsapp: boolean;
    };
    language: string;
}
interface PublicProfile {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: UserRole;
    rating?: number;
    verified: boolean;
}
interface DateRange {
    start: Date;
    end: Date;
}
declare abstract class BaseUser {
    id: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    role: UserRole;
    verified: boolean;
    preferences: UserPreferences;
    createdAt: Date;
    updatedAt: Date;
    abstract getPermissions(): Permission[];
    hasPermission(action: Permission): boolean;
    abstract toPublicProfile(): PublicProfile;
}
declare class GuestUser extends BaseUser {
    getPermissions(): Permission[];
    toPublicProfile(): PublicProfile;
}
declare class Agent extends BaseUser {
    agencyName?: string;
    areasOfOperation: string[];
    subscriptionPlan: SubscriptionPlan;
    referralCode: string;
    commissionRate: number;
    rating: number;
    listings: Listing[];
    clients: any[];
    getPermissions(): Permission[];
    toPublicProfile(): PublicProfile;
    getActiveListings(): Listing[];
    getClosedDeals(_period: DateRange): Transaction[];
}
declare class Developer extends BaseUser {
    portfolio: any[];
    getPermissions(): Permission[];
    toPublicProfile(): PublicProfile;
}
declare class Homeowner extends BaseUser {
    properties: Listing[];
    getPermissions(): Permission[];
    toPublicProfile(): PublicProfile;
}
declare class BuyerClient extends BaseUser {
    wishlist: Listing[];
    savedCollections: SavedCollection[];
    recentlyViewed: RecentlyViewedEntry[];
    transactions: Transaction[];
    assignedAgent?: Agent;
    getPermissions(): Permission[];
    toPublicProfile(): PublicProfile;
}
declare class Admin extends BaseUser {
    getPermissions(): Permission[];
    toPublicProfile(): PublicProfile;
}
declare class SuperAdmin extends Admin {
    getPermissions(): Permission[];
}
interface SavedCollection {
    id: string;
    userId: string;
    name: string;
    listingIds: string[];
    createdAt: Date;
    updatedAt: Date;
}
interface RecentlyViewedEntry {
    id: string;
    userId?: string;
    sessionId?: string;
    listingId: string;
    viewedAt: Date;
}
//# sourceMappingURL=user.types.d.ts.map