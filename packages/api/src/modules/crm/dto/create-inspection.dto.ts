import { z } from 'zod';

export const createInspectionSchema = z
  .object({
    clientId: z.string().min(1).max(64),
    listingId: z.string().min(1).max(64),
    scheduledAt: z.string().datetime(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export type CreateInspectionDto = z.infer<typeof createInspectionSchema>;
