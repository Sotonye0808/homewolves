import { z } from 'zod';

export const createTransactionSchema = z
  .object({
    listingId: z.string().min(1).max(64),
    buyerId: z.string().min(1).max(64),
    type: z.enum(['PURCHASE', 'RENTAL', 'SHORTLET']),
    customSteps: z
      .array(
        z
          .object({
            id: z.string().min(1).max(64),
            label: z.string().trim().min(1).max(200),
            order: z.number().int().nonnegative(),
          })
          .strict(),
      )
      .max(50)
      .optional(),
  })
  .strict();
export type CreateTransactionDto = z.infer<typeof createTransactionSchema>;
