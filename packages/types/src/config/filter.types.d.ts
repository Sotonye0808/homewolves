interface FilterPillConfig {
    id: string;
    label: string;
    queryParam: string;
    icon?: string;
    active: boolean;
    displayOrder: number;
}
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
//# sourceMappingURL=filter.types.d.ts.map