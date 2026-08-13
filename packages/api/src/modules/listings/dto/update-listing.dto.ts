import { z } from 'zod';
import { ListingStatus } from '../../../drizzle/schema';

export const updateListingSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    description: z.string().trim().min(10).max(5000).optional(),
    price: z.coerce.number().nonnegative().max(1_000_000_000_000).optional(),
    currency: z.string().trim().max(10).optional(),
    propertyType: z.string().trim().min(1).max(50).optional(),
    status: z.nativeEnum(ListingStatus).optional(),
    locationJson: z.record(z.string(), z.unknown()).optional(),
    amenityIds: z.array(z.string().min(1)).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    featured: z.boolean().optional(),
  })
  .strict();
export type UpdateListingDto = z.infer<typeof updateListingSchema>;

export const updateListingStatusSchema = z
  .object({
    status: z.nativeEnum(ListingStatus),
  })
  .strict();
export type UpdateListingStatusDto = z.infer<typeof updateListingStatusSchema>;

export const moderateListingSchema = z
  .object({
    action: z.enum(['approve', 'reject']),
  })
  .strict();
export type ModerateListingDto = z.infer<typeof moderateListingSchema>;

export const attachMediaSchema = z
  .object({
    media: z.array(
      z
        .object({
          url: z.string().trim().min(1).max(2000),
          type: z.enum(['image', 'video', 'virtual_tour']).or(z.string().min(1).max(50)),
          isPrimary: z.boolean().optional(),
          altText: z.string().trim().max(500).optional(),
        })
        .strict(),
    ),
  })
  .strict();
export type AttachMediaDto = z.infer<typeof attachMediaSchema>;
