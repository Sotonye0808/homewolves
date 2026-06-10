declare enum ListingCategory {
    SALE = "SALE",
    RENT = "RENT",
    SHORTLET = "SHORTLET",
    LAND = "LAND"
}
declare enum ListingStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    ACTIVE = "ACTIVE",
    SUSPENDED = "SUSPENDED",
    SOLD = "SOLD",
    RENTED = "RENTED"
}
declare enum PropertyType {
    APARTMENT = "APARTMENT",
    HOUSE = "HOUSE",
    DUPLEX = "DUPLEX",
    BUNGALOW = "BUNGALOW",
    TERRACE = "TERRACE",
    SEMI_DETACHED = "SEMI_DETACHED",
    DETACHED = "DETACHED",
    PENTHOUSE = "PENTHOUSE",
    STUDIO = "STUDIO",
    COMMERCIAL = "COMMERCIAL",
    WAREHOUSE = "WAREHOUSE",
    OFFICE = "OFFICE"
}
interface Money {
    amount: number;
    currency: string;
}
interface PropertyLocation {
    state: string;
    city: string;
    area: string;
    address: string;
    lat?: number;
    lng?: number;
}
interface Media {
    id: string;
    url: string;
    type: 'image' | 'video' | 'virtual_tour';
    altText?: string;
    dominantColor?: string;
    width?: number;
    height?: number;
    isPrimary: boolean;
    displayOrder: number;
}
interface AmenityRef {
    amenityId: string;
    label: string;
    icon: string;
}
interface CommissionConfig {
    type: 'percentage' | 'fixed';
    value: number;
    currency: string;
}
declare class Listing {
    id: string;
    title: string;
    description: string;
    price: Money;
    category: ListingCategory;
    type: PropertyType;
    status: ListingStatus;
    verified: boolean;
    featured: boolean;
    location: PropertyLocation;
    media: Media[];
    amenities: AmenityRef[];
    metadata: Record<string, unknown>;
    agent?: Agent;
    developer?: Developer;
    homeowner?: Homeowner;
    commission: CommissionConfig;
    viewCount: number;
    enquiryCount: number;
    createdAt: Date;
    updatedAt: Date;
    getShareableLink(): string;
    isAvailable(): boolean;
    getPrimaryImage(): Media | undefined;
}
//# sourceMappingURL=listing.types.d.ts.map