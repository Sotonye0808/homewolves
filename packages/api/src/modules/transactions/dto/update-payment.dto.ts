import { z } from 'zod';

export const updatePaymentSchema = z
  .object({
    transactionId: z.string().min(1).max(64),
    amount: z.coerce.number().nonnegative().max(1_000_000_000_000),
    currency: z.string().trim().max(10).optional(),
    type: z.enum(['deposit', 'installment', 'commission', 'final']),
    evidenceUrl: z.string().trim().max(2000).optional(),
  })
  .strict();
export type UpdatePaymentDto = z.infer<typeof updatePaymentSchema>;
