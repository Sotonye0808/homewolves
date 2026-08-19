// ─── ENUMS ───────────────────────────────────────────────────

enum UserRole {
  GUEST = 'GUEST',
  BUYER = 'BUYER',
  AGENT = 'AGENT',
  DEVELOPER = 'DEVELOPER',
  HOMEOWNER = 'HOMEOWNER',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

enum Permission {
  LISTING_CREATE = 'LISTING_CREATE',
  LISTING_UPDATE_OWN = 'LISTING_UPDATE_OWN',
  LISTING_DELETE_OWN = 'LISTING_DELETE_OWN',
  LISTING_MODERATE = 'LISTING_MODERATE',
  LISTING_FEATURE = 'LISTING_FEATURE',
  CRM_VIEW_OWN_CLIENTS = 'CRM_VIEW_OWN_CLIENTS',
  CRM_MANAGE_CLIENTS = 'CRM_MANAGE_CLIENTS',
  TRANSACTION_CREATE = 'TRANSACTION_CREATE',
  TRANSACTION_ADVANCE = 'TRANSACTION_ADVANCE',
  TRANSACTION_APPROVE = 'TRANSACTION_APPROVE',
  USER_VERIFY = 'USER_VERIFY',
  USER_SUSPEND = 'USER_SUSPEND',
  AUDIT_LOG_VIEW = 'AUDIT_LOG_VIEW',
  AUDIT_LOG_EXPORT = 'AUDIT_LOG_EXPORT',
  CONFIG_UPDATE = 'CONFIG_UPDATE',
  ANALYTICS_VIEW_OWN = 'ANALYTICS_VIEW_OWN',
  ANALYTICS_VIEW_ALL = 'ANALYTICS_VIEW_ALL',
}

// ─── INTERFACES ─────────────────────────────────────────────

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

// ─── ABSTRACT BASE CLASS ───────────────────────────────────

abstract class BaseUser {
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
  hasPermission(action: Permission): boolean { return this.getPermissions().includes(action); }
  abstract toPublicProfile(): PublicProfile;
}

class GuestUser extends BaseUser {
  getPermissions(): Permission[] { return []; }
  toPublicProfile(): PublicProfile {
    return { id: this.id, firstName: this.firstName, lastName: this.lastName, role: this.role, verified: this.verified };
  }
}

class Agent extends BaseUser {
  agencyName?: string;
  areasOfOperation: string[];
  subscriptionPlan: SubscriptionPlan;
  referralCode: string;
  commissionRate: number;
  rating: number;
  listings: Listing[];
  clients: BaseUser[];

  getPermissions(): Permission[] {
    return [Permission.LISTING_CREATE, Permission.LISTING_UPDATE_OWN, Permission.LISTING_DELETE_OWN, Permission.CRM_VIEW_OWN_CLIENTS, Permission.CRM_MANAGE_CLIENTS, Permission.TRANSACTION_CREATE, Permission.TRANSACTION_ADVANCE, Permission.ANALYTICS_VIEW_OWN];
  }
  toPublicProfile(): PublicProfile {
    return { id: this.id, firstName: this.firstName, lastName: this.lastName, avatar: this.avatar, role: this.role, rating: this.rating, verified: this.verified };
  }
  getActiveListings(): Listing[] { return this.listings.filter(l => l.status === ListingStatus.ACTIVE); }
  getClosedDeals(_period: DateRange): Transaction[] { return []; }
}

class Developer extends BaseUser {
  portfolio: Listing[] = [];

  getPermissions(): Permission[] {
    return [Permission.LISTING_CREATE, Permission.LISTING_UPDATE_OWN, Permission.LISTING_DELETE_OWN, Permission.ANALYTICS_VIEW_OWN];
  }
  toPublicProfile(): PublicProfile {
    return { id: this.id, firstName: this.firstName, lastName: this.lastName, avatar: this.avatar, role: this.role, verified: this.verified };
  }
}

class Homeowner extends BaseUser {
  properties: Listing[] = [];

  getPermissions(): Permission[] {
    return [Permission.LISTING_CREATE, Permission.LISTING_UPDATE_OWN, Permission.LISTING_DELETE_OWN];
  }
  toPublicProfile(): PublicProfile {
    return { id: this.id, firstName: this.firstName, lastName: this.lastName, avatar: this.avatar, role: this.role, verified: this.verified };
  }
}

class BuyerClient extends BaseUser {
  wishlist: Listing[];
  savedCollections: SavedCollection[];
  recentlyViewed: RecentlyViewedEntry[];
  transactions: Transaction[];
  assignedAgent?: Agent;

  getPermissions(): Permission[] {
    return [Permission.TRANSACTION_CREATE];
  }
  toPublicProfile(): PublicProfile {
    return { id: this.id, firstName: this.firstName, lastName: this.lastName, avatar: this.avatar, role: this.role, verified: this.verified };
  }
}

class Admin extends BaseUser {
  getPermissions(): Permission[] {
    return [Permission.LISTING_MODERATE, Permission.LISTING_FEATURE, Permission.USER_VERIFY, Permission.USER_SUSPEND, Permission.TRANSACTION_APPROVE, Permission.AUDIT_LOG_VIEW, Permission.AUDIT_LOG_EXPORT, Permission.CONFIG_UPDATE, Permission.ANALYTICS_VIEW_ALL];
  }
  toPublicProfile(): PublicProfile {
    return { id: this.id, firstName: this.firstName, lastName: this.lastName, avatar: this.avatar, role: this.role, verified: this.verified };
  }
}

class SuperAdmin extends Admin {
  getPermissions(): Permission[] {
    return Object.values(Permission);
  }
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
