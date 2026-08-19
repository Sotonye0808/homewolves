import { z } from 'zod';

export const updateClientSchema = z
  .object({
    status: z.string().trim().max(50).optional(),
  })
  .strict();
export type UpdateClientDto = z.infer<typeof updateClientSchema>;
