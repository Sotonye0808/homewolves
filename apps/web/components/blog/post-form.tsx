'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { RichTextEditor } from './rich-text-editor';

interface PostFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  categories: string;
  tags: string;
  published: boolean;
  featured: boolean;
}

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function BlogPostForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Partial<PostFormState> & { id?: string };
  submitLabel: string;
  onSubmit: (data: Record<string, unknown>) => Promise<{ id?: string; slug?: string }>;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<PostFormState>({
    title: initial?.title ?? '',
    slug: initial?.slug ?? '',
    excerpt: initial?.excerpt ?? '',
    content: initial?.content ?? '',
    coverImage: initial?.coverImage ?? '',
    categories: initial?.categories ?? '',
    tags: initial?.tags ?? '',
    published: initial?.published ?? false,
    featured: initial?.featured ?? false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
    return (
      <div className="rounded-xl p-8 text-center" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)' }}>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Admins only</p>
      </div>
    );
  }

  const set = <K extends keyof PostFormState>(key: K, value: PostFormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async () => {
    setError('');
    const slug = toSlug(form.slug);
    if (!form.title || !slug) {
      setError('Title and slug are required.');
      return;
    }
    setSaving(true);
    try {
      const result = await onSubmit({
        title: form.title,
        slug,
        excerpt: form.excerpt,
        content: form.content,
        coverImage: form.coverImage || undefined,
        categories: splitList(form.categories),
        tags: splitList(form.tags),
        published: form.published,
        featured: form.featured,
      });
      router.push(`/dashboard/admin/blog${initial?.id ? '' : (result.id ? `/${result.id}/edit` : '')}`);
    } catch (e: any) {
      setError(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const field = 'w-full px-3 py-2 text-sm rounded-lg border focus:outline-none';
  const fieldStyle = {
    background: 'var(--color-bg-elevated)',
    borderColor: 'var(--color-border-default)',
    color: 'var(--color-text-primary)',
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Title</span>
          <input
            className={field}
            style={fieldStyle}
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              set('title', title);
              if (!form.slug || form.slug === toSlug(form.title)) set('slug', toSlug(title));
            }}
          />
        </label>
        <label className="block text-sm">
          <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Slug</span>
          <input className={field} style={fieldStyle} value={form.slug} onChange={(e) => set('slug', e.target.value)} />
        </label>
      </div>

      <label className="block text-sm">
        <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Excerpt</span>
        <textarea className={`${field} h-16`} style={fieldStyle} value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
      </label>

      <label className="block text-sm">
        <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Cover image URL</span>
        <input className={field} style={fieldStyle} value={form.coverImage} onChange={(e) => set('coverImage', e.target.value)} placeholder="https://…" />
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Categories (comma-separated)</span>
          <input className={field} style={fieldStyle} value={form.categories} onChange={(e) => set('categories', e.target.value)} placeholder="Buying guides, Market news" />
        </label>
        <label className="block text-sm">
          <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Tags (comma-separated)</span>
          <input className={field} style={fieldStyle} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="Lagos, Investment" />
        </label>
      </div>

      <div className="block text-sm">
        <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Content</span>
        <RichTextEditor value={form.content} onChange={(html) => set('content', html)} />
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <input type="checkbox" checked={form.published} onChange={(e) => set('published', e.target.checked)} />
          Published
        </label>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />
          Featured
        </label>
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--color-status-rejected)' }}>{error}</p>}

      <button
        onClick={submit}
        disabled={saving}
        className="px-6 py-2 text-sm font-semibold rounded-full"
        style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
      >
        {saving ? 'Saving…' : submitLabel}
      </button>
    </div>
  );
}