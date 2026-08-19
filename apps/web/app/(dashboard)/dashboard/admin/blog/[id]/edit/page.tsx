'use client';

import { BlogPostForm } from '@/components/blog/post-form';
import { useBlogPosts, useUpdateBlogPost } from '@/hooks/use-blog';

export default function EditBlogPostPage({ params }: { params: { id: string } }) {
  const { data, isLoading } = useBlogPosts({ published: 'all', limit: 100 });
  const updatePost = useUpdateBlogPost();
  const post = (data?.posts ?? []).find((p: any) => p.id === params.id);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-[900px] mx-auto h-40 skeleton rounded-xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background grid place-items-center px-4">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Post not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[900px] mx-auto">
        <h1 className="text-2xl font-bold font-display mb-6" style={{ color: 'var(--color-brand-primary)' }}>
          Edit Post
        </h1>
        <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-glass)' }}>
          <BlogPostForm
            initial={{
              id: post.id,
              title: post.title,
              slug: post.slug,
              excerpt: post.excerpt,
              content: post.content,
              coverImage: post.coverImage ?? '',
              categories: (post.categories ?? []).join(', '),
              tags: (post.tags ?? []).join(', '),
              published: post.published,
              featured: post.featured,
            }}
            submitLabel="Save changes"
            onSubmit={(data) =>
              updatePost.mutateAsync({ id: post.id, data: data as Record<string, unknown> }).then((updated: any) => ({
                id: updated?.id,
                slug: updated?.slug,
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}