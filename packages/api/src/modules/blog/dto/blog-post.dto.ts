import { z } from 'zod';

export const createBlogPostSchema = z
  .object({
    title: z.string().trim().min(3).max(200),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case'),
    excerpt: z.string().trim().min(1).max(500),
    content: z.string().min(1).max(1_000_000),
    coverImage: z.string().trim().max(2000).optional(),
    categories: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    published: z.boolean().optional(),
  })
  .strict();
export type CreateBlogPostDto = z.infer<typeof createBlogPostSchema>;

export const updateBlogPostSchema = z
  .object({
    title: z.string().trim().min(3).max(200).optional(),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be kebab-case')
      .optional(),
    excerpt: z.string().trim().min(1).max(500).optional(),
    content: z.string().min(1).max(1_000_000).optional(),
    coverImage: z.string().trim().max(2000).optional(),
    categories: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
    tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
    published: z.boolean().optional(),
    featured: z.boolean().optional(),
  })
  .strict();
export type UpdateBlogPostDto = z.infer<typeof updateBlogPostSchema>;
