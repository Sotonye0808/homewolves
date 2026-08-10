import { z } from 'zod';

export const updatePreferencesSchema = z
  .object({
    preferences: z.record(z.string().max(50), z.boolean()),
  })
  .strict();
export type UpdatePreferencesDto = z.infer<typeof updatePreferencesSchema>;
