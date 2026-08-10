import { z } from 'zod';

export const createRatingSchema = z
  .object({
    score: z.number().int().min(1).max(5),
    review: z.string().trim().max(2000).optional(),
  })
  .strict();
export type CreateRatingDto = z.infer<typeof createRatingSchema>;
