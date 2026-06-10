interface RegisterDto {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    referralCode?: string;
}
interface LoginDto {
    email?: string;
    phone?: string;
    otp: string;
}
interface CreateListingDto {
    title: string;
    description: string;
    price: number;
    currency?: string;
    category: ListingCategory;
    propertyType: string;
    location: {
        state: string;
        city: string;
        area: string;
        address: string;
        lat?: number;
        lng?: number;
    };
    amenityIds?: string[];
    media?: {
        url: string;
        type: 'image' | 'video';
        isPrimary?: boolean;
    }[];
    commission?: {
        type: 'percentage' | 'fixed';
        value: number;
    };
}
interface UpdateListingDto extends Partial<CreateListingDto> {
    id: string;
    status?: ListingStatus;
    featured?: boolean;
    verified?: boolean;
}
interface ScheduleInspectionDto {
    listingId: string;
    clientId: string;
    scheduledAt: string;
    notes?: string;
}
interface AddClientNoteDto {
    clientId: string;
    content: string;
}
interface RateClientDto {
    clientId: string;
    rating: number;
}
interface CreateTransactionDto {
    listingId: string;
    buyerId: string;
    type: TransactionType;
}
interface AdvanceTransactionDto {
    transactionId: string;
    evidence?: {
        type: string;
        url: string;
        notes?: string;
    };
}
//# sourceMappingURL=trpc.types.d.ts.map