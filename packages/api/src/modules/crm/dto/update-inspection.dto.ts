import { z } from 'zod';

export const updateInspectionSchema = z
  .object({
    status: z.string().trim().max(50).optional(),
    scheduledAt: z.string().datetime().optional(),
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export type UpdateInspectionDto = z.infer<typeof updateInspectionSchema>;
