import { z } from 'zod';

export const advanceTransactionSchema = z
  .object({
    notes: z.string().trim().max(2000).optional(),
  })
  .strict();
export type AdvanceTransactionDto = z.infer<typeof advanceTransactionSchema>;
