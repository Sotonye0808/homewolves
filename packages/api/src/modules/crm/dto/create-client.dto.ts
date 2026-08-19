import { z } from 'zod';

export const createClientSchema = z
  .object({
    buyerId: z.string().min(1).max(64),
    status: z.string().trim().max(50).optional(),
  })
  .strict();
export type CreateClientDto = z.infer<typeof createClientSchema>;
