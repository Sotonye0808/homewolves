import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { sanitizeBlogHtml } from '../../common/utils/html-sanitizer';

const db = (prisma: PrismaService) => prisma;

@Injectable()
export class BlogService {
  constructor(
    private prisma: PrismaService,
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
    const post = await db(this.prisma).blogPost.create({
      data: {
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
      },
      include: { author: true },
    });

    await this.audit.log({
      entityType: 'BlogPost',
      entityId: post.id,
      action: 'BLOG_CREATED',
      actor,
      metadata: { title: dto.title, slug: dto.slug },
    });

    return post;
  }

  async findAll(params: {
    published?: boolean;
    category?: string;
    tag?: string;
    featured?: boolean;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};
    if (params.published != null) where.published = params.published;
    if (params.category) where.categories = { has: params.category };
    if (params.tag) where.tags = { has: params.tag };
    if (params.featured != null) where.featured = params.featured;

    const page = params.page ?? 1;
    const limit = params.limit ?? 12;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      db(this.prisma).blogPost.findMany({
        where,
        skip,
        take: limit,
        orderBy: params.featured ? { updatedAt: 'desc' } : { publishedAt: 'desc' },
        include: { author: true },
      }),
      db(this.prisma).blogPost.count({ where }),
    ]);

    return { posts, total, page, limit };
  }

  async findBySlug(slug: string) {
    const post = await db(this.prisma).blogPost.findUnique({
      where: { slug },
      include: { author: true },
    });
    if (!post) throw new NotFoundException('Blog post not found');
    return post;
  }

  async findById(id: string) {
    const post = await db(this.prisma).blogPost.findUnique({
      where: { id },
      include: { author: true },
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
    const post = await db(this.prisma).blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');

    const data: any = { ...dto };
    if (dto.content) data.content = sanitizeBlogHtml(dto.content);
    if (dto.published && !post.publishedAt) {
      data.publishedAt = new Date();
    }

    const updated = await db(this.prisma).blogPost.update({
      where: { id },
      data,
      include: { author: true },
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
    const post = await db(this.prisma).blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Blog post not found');

    await db(this.prisma).blogPost.delete({ where: { id } });

    await this.audit.log({
      entityType: 'BlogPost',
      entityId: id,
      action: 'BLOG_DELETED',
      actor,
      metadata: { title: post.title },
    });
  }

  async getCategories() {
    const posts = await db(this.prisma).blogPost.findMany({
      where: { published: true },
      select: { categories: true },
    });
    const categorySet = new Set<string>();
    posts.forEach((p: any) => p.categories?.forEach((c: string) => categorySet.add(c)));
    return Array.from(categorySet).sort();
  }
}
