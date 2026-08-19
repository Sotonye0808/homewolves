import { z } from 'zod';

export const upsertEmailTemplateSchema = z
  .object({
    key: z.string().trim().regex(/^[a-z0-9_]+$/, 'Key must be lowercase letters, numbers, and underscores').min(1).max(80),
    name: z.string().trim().min(1).max(120),
    subject: z.string().trim().min(1).max(200),
    htmlBody: z.string().trim().min(1),
    textBody: z.string().trim().max(10000).optional().nullable(),
    fromEmail: z.string().trim().email().max(320).optional().nullable(),
    active: z.boolean().optional(),
  })
  .strict();
export type UpsertEmailTemplateDto = z.infer<typeof upsertEmailTemplateSchema>;

export const previewEmailTemplateSchema = z
  .object({
    key: z.string().trim().min(1).max(80),
    subject: z.string().trim().min(1).max(200),
    htmlBody: z.string().trim().min(1),
    textBody: z.string().trim().max(10000).optional().nullable(),
    variables: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export type PreviewEmailTemplateDto = z.infer<typeof previewEmailTemplateSchema>;