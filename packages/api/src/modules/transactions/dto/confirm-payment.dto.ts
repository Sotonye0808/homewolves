import { z } from 'zod';

export const confirmPaymentSchema = z
  .object({
    paymentId: z.string().min(1).max(64),
    status: z.enum(['confirmed', 'rejected']),
    confirmedBy: z.string().min(1).max(64),
  })
  .strict();
export type ConfirmPaymentDto = z.infer<typeof confirmPaymentSchema>;
