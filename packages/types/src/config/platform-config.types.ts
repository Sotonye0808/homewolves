// ─── INTERFACES ─────────────────────────────────────────────

interface FeatureFlag {
  id: string;
  enabled: boolean;
  rolloutPercentage: number;
  roles: UserRole[];
}

interface AmenityConfig {
  id: string;
  label: string;
  icon: string;
  active: boolean;
  displayOrder: number;
}

interface PropertyTypeConfig {
  id: string;
  label: string;
  icon: string;
  category: ListingCategory;
  active: boolean;
  displayOrder: number;
}

interface TransactionStepTemplate {
  id: string;
  label: string;
  order: number;
  requiredRoles: UserRole[];
  requiresEvidence: boolean;
  active: boolean;
}

// ─── PLATFORM CONFIG CLASS ──────────────────────────────────

class PlatformConfig {
  amenities: AmenityConfig[];
  filterPills: FilterPillConfig[];
  navItems: NavItemConfig[];
  subscriptionPlans: SubscriptionPlan[];
  featureFlags: FeatureFlag[];
  notificationTemplates: NotificationTemplate[];
  propertyTypes: PropertyTypeConfig[];
  transactionStepTemplates: TransactionStepTemplate[];
}
