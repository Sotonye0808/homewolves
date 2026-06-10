import { ListingCategory } from '@prisma/client';

export class CreateListingDto {
  title: string;
  description: string;
  price: number;
  currency?: string;
  category: ListingCategory;
  propertyType: string;
  locationJson: Record<string, unknown>;
  amenityIds?: string[];
  metadata?: Record<string, unknown>;
  agentId?: string;
}
