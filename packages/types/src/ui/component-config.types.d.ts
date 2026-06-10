interface ComponentConfig {
    variant?: string;
    className?: string;
    data?: Record<string, unknown>;
}
interface PropertyCardConfig extends ComponentConfig {
    showAgent?: boolean;
    showBadges?: boolean;
    maxPills?: number;
    imageAspectRatio?: '16:9' | '4:3' | '1:1';
    priceSize?: string;
}
interface BentoCellConfig extends ComponentConfig {
    size: '1x1' | '2x1' | '1x2' | '2x2' | '3x1' | 'full';
    title?: string;
    icon?: string;
    mobileOrder?: number;
}
interface NavItemDisplayConfig extends ComponentConfig {
    label: string;
    icon: string;
    path: string;
    badge?: string;
    active?: boolean;
}
interface FilterBarConfig extends ComponentConfig {
    pills: FilterPillConfig[];
    showSearch?: boolean;
    showViewToggle?: boolean;
    layout?: 'stacked' | 'inline';
}
//# sourceMappingURL=component-config.types.d.ts.map