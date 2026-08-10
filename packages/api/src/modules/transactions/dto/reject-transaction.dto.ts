import { z } from 'zod';

export const rejectTransactionSchema = z
  .object({
    reason: z.string().trim().min(1).max(2000),
  })
  .strict();
export type RejectTransactionDto = z.infer<typeof rejectTransactionSchema>;
