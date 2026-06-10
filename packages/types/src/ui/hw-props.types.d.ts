interface HwButtonProps {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon-only';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    disabled?: boolean;
    children?: React.ReactNode;
    onClick?: () => void;
    config?: ComponentConfig;
}
interface HwInputProps {
    label?: string;
    placeholder?: string;
    type?: string;
    error?: string;
    value?: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    config?: ComponentConfig;
}
interface HwDialogProps {
    open: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    children?: React.ReactNode;
    config?: ComponentConfig;
}
interface HwSelectProps {
    label?: string;
    placeholder?: string;
    options: {
        value: string;
        label: string;
    }[];
    value?: string;
    onChange?: (value: string) => void;
    error?: string;
    disabled?: boolean;
    config?: ComponentConfig;
}
interface HwTabsProps {
    tabs: {
        id: string;
        label: string;
        icon?: string;
    }[];
    activeTab?: string;
    onTabChange?: (tabId: string) => void;
    config?: ComponentConfig;
}
interface HwSheetProps {
    open: boolean;
    onClose: () => void;
    side?: 'left' | 'right' | 'bottom';
    title?: string;
    children?: React.ReactNode;
    config?: ComponentConfig;
}
interface HwBadgeProps {
    variant?: 'sale' | 'rent' | 'shortlet' | 'land' | 'verified' | 'pending' | 'complete' | 'rejected' | 'default';
    children?: React.ReactNode;
    config?: ComponentConfig;
}
interface HwCardProps {
    variant?: 'default' | 'glass' | 'elevated' | 'bento';
    padding?: 'sm' | 'md' | 'lg' | 'none';
    children?: React.ReactNode;
    onClick?: () => void;
    hoverable?: boolean;
    config?: ComponentConfig;
}
interface HwTableProps {
    columns: {
        key: string;
        label: string;
        sortable?: boolean;
    }[];
    data: Record<string, unknown>[];
    onSort?: (key: string, direction: 'asc' | 'desc') => void;
    loading?: boolean;
    config?: ComponentConfig;
}
interface HwAvatarProps {
    src?: string;
    name: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fallback?: string;
    config?: ComponentConfig;
}
interface HwSkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'image';
    width?: string | number;
    height?: string | number;
    count?: number;
    config?: ComponentConfig;
}
//# sourceMappingURL=hw-props.types.d.ts.map