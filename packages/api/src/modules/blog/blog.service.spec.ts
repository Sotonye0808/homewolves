import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlogService } from './blog.service';
import { createDrizzleMock, createChain } from '../../test/drizzle.mock';
import { AuditService } from '../audit/audit.service';
import { blogPosts } from '../../drizzle/schema';

type MockFn = ReturnType<typeof vi.fn>;

describe('BlogService', () => {
  let service: BlogService;
  let mocks: ReturnType<typeof createDrizzleMock>;
  let audit: { log: MockFn };

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
    mocks = createDrizzleMock();
    audit = { log: vi.fn().mockResolvedValue(undefined) };
    service = new BlogService(mocks.db, audit as unknown as AuditService);
  });

  describe('create', () => {
    it('creates a post and sanitises the HTML content', async () => {
      const values: Array<Record<string, unknown>> = [];
      mocks.insert.mockReturnValue(
        createChain([post], (method, args) => {
          if (method === 'values') values.push(args[0] as Record<string, unknown>);
        }),
      );
      mocks.table('blogPosts').findFirst.mockResolvedValue({ ...post, author: {} });

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

      expect(mocks.insert).toHaveBeenCalledWith(blogPosts);
      expect(values[0]!.content as string).not.toContain('<script>');
      expect(values[0]!.content as string).toContain('<p>Hello');
      expect(values[0]!.publishedAt).toEqual(expect.any(Date));
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'BLOG_CREATED' }));
      expect(result!.id).toBe('p-1');
    });
  });

  describe('findAll', () => {
    it('filters by published, category, and tag', async () => {
      mocks.table('blogPosts').findMany.mockResolvedValue([post]);
      mocks.select.mockReturnValue(createChain([{ value: 1 }]));

      const result = await service.findAll({ published: true, category: 'market', tag: 'report', page: 2, limit: 12 });

      expect(mocks.table('blogPosts').findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 12, offset: 12 }),
      );
      expect(result.total).toBe(1);
    });
  });

  describe('findBySlug', () => {
    it('throws NotFound for a missing post', async () => {
      mocks.table('blogPosts').findFirst.mockResolvedValue(null);
      await expect(service.findBySlug('nope')).rejects.toThrow('Blog post not found');
    });

    it('returns the post', async () => {
      mocks.table('blogPosts').findFirst.mockResolvedValue(post);
      const result = await service.findBySlug('market-report');
      expect(result.id).toBe('p-1');
    });
  });

  describe('update', () => {
    it('updates and sanitises content, sets publishedAt on first publish', async () => {
      mocks.select.mockReturnValue(createChain([{ ...post, publishedAt: null }]));
      const setArgs: Array<Record<string, unknown>> = [];
      mocks.update.mockReturnValue(
        createChain([], (method, args) => {
          if (method === 'set') setArgs.push(args[0] as Record<string, unknown>);
        }),
      );
      mocks.table('blogPosts').findFirst.mockResolvedValue({ ...post, content: '<p>Hello</p>', publishedAt: new Date() });

      const result = await service.update(
        'p-1',
        { content: '<p>Hello <script>x()</script></p>', published: true },
        actor,
      );

      expect(mocks.update).toHaveBeenCalledWith(blogPosts);
      expect(setArgs[0]!.content as string).not.toContain('<script>');
      expect(setArgs[0]!.publishedAt).toEqual(expect.any(Date));
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'BLOG_UPDATED' }));
      expect(result!.id).toBe('p-1');
    });
  });

  describe('delete', () => {
    it('deletes an existing post and audits', async () => {
      mocks.select.mockReturnValue(createChain([post]));

      await service.delete('p-1', actor);

      expect(mocks.delete).toHaveBeenCalledWith(blogPosts);
      expect(audit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'BLOG_DELETED' }));
    });
  });

  describe('getCategories', () => {
    it('returns a sorted deduplicated list of categories', async () => {
      mocks.select.mockReturnValue(
        createChain([
          { categories: ['market', 'finance'] },
          { categories: ['market'] },
          { categories: [] },
        ]),
      );

      const result = await service.getCategories();

      expect(result).toEqual(['finance', 'market']);
    });
  });
});
