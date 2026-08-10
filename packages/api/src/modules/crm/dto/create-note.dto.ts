import { z } from 'zod';

export const createNoteSchema = z
  .object({
    content: z.string().trim().min(1).max(5000),
  })
  .strict();
export type CreateNoteDto = z.infer<typeof createNoteSchema>;
