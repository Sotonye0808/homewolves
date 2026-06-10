interface FilterPillConfig {
  id: string;
  label: string;
  queryParam: string;
  icon?: string;
  active: boolean;
  displayOrder: number;
}

// Navigation items — fully configurable
interface NavItemConfig {
  id: string;
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
  active: boolean;
  displayOrder: number;
  badge?: string;
}
