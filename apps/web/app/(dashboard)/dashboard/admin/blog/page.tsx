'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useBlogPosts, useDeleteBlogPost, useUpdateBlogPost } from '@/hooks/use-blog';

export default function BlogAdminPage() {
  const { user } = useAuth();
  const { data, isLoading } = useBlogPosts({ published: 'all' });
  const deletePost = useDeleteBlogPost();
  const updatePost = useUpdateBlogPost();
  const [notice, setNotice] = useState('');

  if (!user) return <AdminOnly />;
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') return <AdminOnly />;

  const posts = data?.posts ?? [];

  const togglePublish = async (post: any) => {
    setNotice('');
    try {
      await updatePost.mutateAsync({ id: post.id, data: { published: !post.published } });
      setNotice(`${post.published ? 'Unpublished' : 'Published'} "${post.title}"`);
    } catch (e: any) {
      setNotice(e.message ?? 'Update failed');
    }
  };

  const remove = async (post: any) => {
    if (!window.confirm(`Delete "${post.title}"?`)) return;
    setNotice('');
    try {
      await deletePost.mutateAsync(post.id);
      setNotice('Deleted');
    } catch (e: any) {
      setNotice(e.message ?? 'Delete failed');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1000px] mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--color-brand-primary)' }}>
              Blog Posts
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Create, edit and publish articles.
            </p>
          </div>
          <Link
            href="/dashboard/admin/blog/new"
            className="px-4 py-2 text-sm font-semibold rounded-full"
            style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
          >
            New post
          </Link>
        </div>

        {notice && <p className="text-sm mb-4" style={{ color: 'var(--color-status-active)' }}>{notice}</p>}

        <div className="rounded-xl overflow-hidden border" style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-subtle)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr>
                {['Title', 'Status', 'Updated', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'var(--color-text-muted)', background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-default)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={4} className="px-4 py-3"><div className="h-4 skeleton rounded" /></td>
                  </tr>
                ))}
              {!isLoading && posts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    No posts yet — create your first one.
                  </td>
                </tr>
              )}
              {posts.map((post: any) => (
                <tr key={post.id} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td className="px-4 py-3">
                    <div className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{post.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">{post.slug}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full"
                      style={{
                        background: post.published ? 'var(--color-success-bg)' : 'var(--color-warning-bg)',
                        color: post.published ? 'var(--color-status-active)' : 'var(--color-warning)',
                      }}
                    >
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                    {post.featured && (
                      <span className="ml-1 inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    {post.updatedAt ? new Date(post.updatedAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/admin/blog/${post.id}/edit`}
                        className="px-3 py-1 text-xs font-semibold rounded-full"
                        style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-brand-primary)', color: 'var(--color-brand-primary)' }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => togglePublish(post)}
                        className="px-3 py-1 text-xs font-semibold rounded-full"
                        style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-secondary)' }}
                      >
                        {post.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => remove(post)}
                        className="px-3 py-1 text-xs font-semibold rounded-full"
                        style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-status-rejected)', color: 'var(--color-status-rejected)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function AdminOnly() {
  return (
    <div className="min-h-screen bg-background grid place-items-center px-4">
      <div className="max-w-sm w-full p-8 rounded-xl bg-[var(--color-bg-glass)] border border-[var(--color-border-glass)] shadow-glass text-center">
        <h1 className="font-display text-xl font-bold text-foreground mb-2">Admins only</h1>
        <p className="text-sm text-secondary">You need an ADMIN role to manage blog posts.</p>
      </div>
    </div>
  );
}