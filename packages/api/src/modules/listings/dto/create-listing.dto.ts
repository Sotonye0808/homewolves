import { z } from 'zod';
import { ListingCategory } from '@prisma/client';

export const createListingSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    description: z.string().trim().min(10).max(5000),
    price: z.coerce.number().nonnegative().max(1_000_000_000_000),
    currency: z.string().trim().max(10).optional(),
    category: z.nativeEnum(ListingCategory),
    propertyType: z.string().trim().min(1).max(50),
    locationJson: z.record(z.string(), z.unknown()),
    amenityIds: z.array(z.string().min(1)).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    agentId: z.string().min(1).optional(),
  })
  .strict();
export type CreateListingDto = z.infer<typeof createListingSchema>;
