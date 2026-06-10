import { ListingStatus } from '@prisma/client';

export class UpdateListingDto {
  title?: string;
  description?: string;
  price?: number;
  currency?: string;
  propertyType?: string;
  status?: ListingStatus;
  locationJson?: Record<string, unknown>;
  amenityIds?: string[];
  metadata?: Record<string, unknown>;
  featured?: boolean;
}

export class UpdateListingStatusDto {
  status: ListingStatus;
}
