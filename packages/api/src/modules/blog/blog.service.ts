import { Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, count, sql } from 'drizzle-orm';
import { DrizzleService } from '../../drizzle/drizzle.service';
import { AuditService } from '../audit/audit.service';
import { sanitizeBlogHtml } from '../../common/utils/html-sanitizer';
import { blogPosts } from '../../drizzle/schema';

@Injectable()
export class BlogService {
  constructor(
    private db: DrizzleService,
    private audit: AuditService,
  ) {}

  async create(dto: {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage?: string;
    authorId: string;
    categories?: string[];
    tags?: string[];
    published?: boolean;
  }, actor: ActorRef) {
    const [post] = await this.db
      .insert(blogPosts)
      .values({
        title: dto.title,
        slug: dto.slug,
        excerpt: dto.excerpt,
        content: sanitizeBlogHtml(dto.content),
        coverImage: dto.coverImage ?? null,
        authorId: dto.authorId,
        categories: dto.categories ?? [],
        tags: dto.tags ?? [],
        published: dto.published ?? false,
        publishedAt: dto.published ? new Date() : null,
      })
      .returning();
    if (!post) throw new Error('Failed to create blog post');

    const full = await this.db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, post.id),
      with: { author: true },
    });

    await this.audit.log({
      entityType: 'BlogPost',
      entityId: post.id,
      action: 'BLOG_CREATED',
      actor,
      metadata: { title: dto.title, slug: dto.slug },
    });

    return full;
  }

  async findAll(params: {
    published?: boolean;
    category?: string;
    tag?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  }) {
    const conditions = [];
    if (params.published != null) conditions.push(eq(blogPosts.published, params.published));
    if (params.category) conditions.push(sql`${blogPosts.categories} @> ARRAY[${params.category}]`);
    if (params.tag) conditions.push(sql`${blogPosts.tags} @> ARRAY[${params.tag}]`);
    if (params.featured != null) conditions.push(eq(blogPosts.featured, params.featured));

    const page = params.page ?? 1;
    const limit = params.limit ?? 12;
    const skip = (page - 1) * limit;
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [posts, total] = await Promise.all([
      this.db.query.blogPosts.findMany({
        where,
        offset: skip,
        limit,
        orderBy: params.featured ? desc(blogPosts.updatedAt) : desc(blogPosts.publishedAt),
        with: { author: true },
      }),
      this.db.select({ value: count() }).from(blogPosts).where(where),
    ]);

    return { posts, total: total[0]?.value ?? 0, page, limit };
  }

  async findBySlug(slug: string) {
    const post = await this.db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, slug),
      with: { author: true },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async findById(id: string) {
    const post = await this.db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
      with: { author: true },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async update(id: string, dto: Partial<{
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    coverImage: string;
    categories: string[];
    tags: string[];
    published: boolean;
    featured: boolean;
  }>, actor: ActorRef) {
    const [post] = await this.db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (!post) throw new NotFoundException('Blog post not found');

    const set: Partial<typeof blogPosts.$inferInsert> = { ...dto };
    if (dto.content) set.content = sanitizeBlogHtml(dto.content);
    if (dto.published && !post.publishedAt) {
      set.publishedAt = new Date();
    }

    await this.db.update(blogPosts).set(set).where(eq(blogPosts.id, id));

    const updated = await this.db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
      with: { author: true },
    });

    await this.audit.log({
      entityType: 'BlogPost',
      entityId: id,
      action: 'BLOG_UPDATED',
      actor,
      metadata: { changes: Object.keys(dto) },
    });

    return updated;
  }

  async delete(id: string, actor: ActorRef) {
    const [post] = await this.db.select().from(blogPosts).where(eq(blogPosts.id, id));
    if (!post) throw new NotFoundException('Blog post not found');

    await this.db.delete(blogPosts).where(eq(blogPosts.id, id));

    await this.audit.log({
      entityType: 'BlogPost',
      entityId: id,
      action: 'BLOG_DELETED',
      actor,
      metadata: { title: post.title },
    });
  }

  async getCategories() {
    const posts = await this.db.select({ categories: blogPosts.categories }).from(blogPosts).where(eq(blogPosts.published, true));
    const categorySet = new Set<string>();
    posts.forEach((p) => p.categories?.forEach((c: string) => categorySet.add(c)));
    return Array.from(categorySet).sort();
  }
}