'use client';

import { BlogPostForm } from '@/components/blog/post-form';
import { useCreateBlogPost } from '@/hooks/use-blog';

export default function NewBlogPostPage() {
  const createPost = useCreateBlogPost();

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[900px] mx-auto">
        <h1 className="text-2xl font-bold font-display mb-6" style={{ color: 'var(--color-brand-primary)' }}>
          New Blog Post
        </h1>
        <div className="rounded-xl p-6" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-glass)' }}>
          <BlogPostForm
            submitLabel="Create post"
            onSubmit={(data) =>
              createPost.mutateAsync(data as never).then((post: any) => ({
                id: post?.id,
                slug: post?.slug,
              }))
            }
          />
        </div>
      </div>
    </div>
  );
}