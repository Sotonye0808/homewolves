import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlogService } from './blog.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

type MockFn = ReturnType<typeof vi.fn>;

describe('BlogService', () => {
  let service: BlogService;
  let prisma: PrismaService;
  let audit: { log: MockFn };

  const blogPostCreate = vi.fn();
  const blogPostFindMany = vi.fn();
  const blogPostCount = vi.fn();
  const blogPostFindUnique = vi.fn();
  const blogPostUpdate = vi.fn();
  const blogPostDelete = vi.fn();

  const actor = { id: 'admin-1', role: 'ADMIN', name: 'Admin' };
  const post = {
    id: 'p-1',
    title: 'Market Report',
    slug: 'market-report',
    excerpt: 'Q3 market summary',
    content: '<p>Hello <script>alert(1)</script></p>',
    coverImage: null,
    authorId: 'admin-1',
    categories: ['market'],
    tags: ['report'],
    published: true,
    publishedAt: new Date(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
    prisma = {
      blogPost: {
        create: blogPostCreate,
        findMany: blogPostFindMany,
        count: blogPostCount,
        findUnique: blogPostFindUnique,
        update: blogPostUpdate,
        delete: blogPostDelete,
      },
    } as unknown as PrismaService;
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    service = new BlogService(prisma, audit as unknown as AuditService);
  });

  describe('create', () => {
    it('creates a post and sanitises the HTML content', async () => {
      blogPostCreate.mockResolvedValue(post);

      const result = await service.create(
        {
          title: 'Market Report',
          slug: 'market-report',
          excerpt: 'Q3 market summary',
          content: '<p>Hello <script>alert(1)</script></p>',
          authorId: 'admin-1',
          categories: ['market'],
          published: true,
        },
        actor,
      );

      const createArg = blogPostCreate.mock.calls[0]![0];
      expect(createArg.data.content).not.toContain('<script>');
      expect(createArg.data.content).toContain('<p>Hello');
      expect(createArg.data.publishedAt).toEqual(expect.any(Date));
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'BLOG_CREATED' }));
      expect(result.id).toBe('p-1');
    });
  });

  describe('findAll', () => {
    it('filters by published, category, and tag', async () => {
      blogPostFindMany.mockResolvedValue([post]);
      blogPostCount.mockResolvedValue(1);

      const result = await service.findAll({ published: true, category: 'market', tag: 'report', page: 2, limit: 12 });

      expect(blogPostFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ published: true, categories: { has: 'market' }, tags: { has: 'report' } }),
          skip: 12,
          take: 12,
        }),
      );
      expect(result.total).toBe(1);
    });
  });

  describe('findBySlug', () => {
    it('throws NotFound for a missing post', async () => {
      blogPostFindUnique.mockResolvedValue(null);
      await expect(service.findBySlug('nope')).rejects.toThrow('Blog post not found');
    });

    it('returns the post', async () => {
      blogPostFindUnique.mockResolvedValue(post);
      const result = await service.findBySlug('market-report');
      expect(result.id).toBe('p-1');
    });
  });

  describe('update', () => {
    it('updates and sanitises content, sets publishedAt on first publish', async () => {
      blogPostFindUnique.mockResolvedValue({ ...post, publishedAt: null });
      blogPostUpdate.mockResolvedValue({ ...post, content: '<p>Hello</p>', publishedAt: new Date() });

      const result = await service.update(
        'p-1',
        { content: '<p>Hello <script>x()</script></p>', published: true },
        actor,
      );

      const updateArg = blogPostUpdate.mock.calls[0]![0];
      expect(updateArg.data.content).not.toContain('<script>');
      expect(updateArg.data.publishedAt).toEqual(expect.any(Date));
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'BLOG_UPDATED' }));
      expect(result.id).toBe('p-1');
    });
  });

  describe('delete', () => {
    it('deletes an existing post and audits', async () => {
      blogPostFindUnique.mockResolvedValue(post);
      blogPostDelete.mockResolvedValue(post);

      await service.delete('p-1', actor);

      expect(blogPostDelete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'BLOG_DELETED' }));
    });
  });

  describe('getCategories', () => {
    it('returns a sorted deduplicated list of categories', async () => {
      blogPostFindMany.mockResolvedValue([
        { categories: ['market', 'finance'] },
        { categories: ['market'] },
        { categories: [] },
      ]);

      const result = await service.getCategories();

      expect(result).toEqual(['finance', 'market']);
    });
  });
});
