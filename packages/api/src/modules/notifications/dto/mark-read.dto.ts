import { z } from 'zod';

export const markReadSchema = z
  .object({
    notificationIds: z.array(z.string().min(1).max(64)).min(1).max(100),
  })
  .strict();
export type MarkReadDto = z.infer<typeof markReadSchema>;
