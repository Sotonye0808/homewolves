interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
interface ApiError {
    code: string;
    message: string;
    field?: string;
    details?: Record<string, unknown>;
}
interface SearchParams {
    query?: string;
    category?: ListingCategory;
    propertyType?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    location?: string;
    sort?: 'newest' | 'price_asc' | 'price_desc' | 'most_viewed';
    page?: number;
    limit?: number;
}
//# sourceMappingURL=rest.types.d.ts.map