'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import {
  useEmailTemplates,
  useSaveEmailTemplate,
  usePreviewEmailTemplate,
  useSeedEmailTemplates,
} from '@/hooks/use-email-templates';
import type { EmailTemplateDto } from '@/lib/email-templates';

const NOT_ADMIN = (
  <div className="min-h-screen bg-background grid place-items-center px-4">
    <div className="max-w-sm w-full p-8 rounded-xl bg-[var(--color-bg-glass)] border border-[var(--color-border-glass)] shadow-glass text-center">
      <h1 className="font-display text-xl font-bold text-foreground mb-2">Admins only</h1>
      <p className="text-sm text-secondary">You need an ADMIN role to manage email templates.</p>
    </div>
  </div>
);

export default function EmailTemplatesAdminPage() {
  const { user } = useAuth();
  const { data: templates, isLoading } = useEmailTemplates();
  const saveTemplate = useSaveEmailTemplate();
  const seed = useSeedEmailTemplates();
  const preview = usePreviewEmailTemplate();
  const [query, setQuery] = useState('');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const selected = templates?.find((t) => t.key === selectedKey) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates ?? [];
    return (templates ?? []).filter(
      (t) => t.key.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
    );
  }, [templates, query]);

  if (!user) return NOT_ADMIN;
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') return NOT_ADMIN;

  const save = async (data: EmailTemplateDto) => {
    setNotice('');
    try {
      await saveTemplate.mutateAsync(data);
      setNotice('Saved');
    } catch (e: any) {
      setNotice(e.message ?? 'Save failed');
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--color-brand-primary)' }}>
              Email Templates
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Config-driven transactional emails — edits are applied live by the API.
            </p>
          </div>
          <button
            onClick={async () => {
              const n = await seed.mutateAsync();
              setNotice(`Seeded ${n} missing template(s)`);
            }}
            className="px-4 py-2 text-sm font-semibold rounded-full"
            style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
          >
            Seed defaults
          </button>
        </div>

        {notice && <p className="text-sm mb-4" style={{ color: 'var(--color-status-active)' }}>{notice}</p>}

        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* Template list */}
          <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-glass)' }}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates…"
              className="w-full px-3 py-2 text-sm rounded-lg border mb-3"
              style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border-default)', color: 'var(--color-text-primary)' }}
            />
            <ul className="space-y-1 max-h-[70vh] overflow-y-auto">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <li key={i} className="h-10 skeleton rounded-lg" />
                ))}
              {filtered.map((t) => (
                <li key={t.key}>
                  <button
                    onClick={() => {
                      setSelectedKey(t.key);
                      setNotice('');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all"
                    style={{
                      background: selectedKey === t.key ? 'var(--color-bg-elevated)' : 'transparent',
                      color: selectedKey === t.key ? 'var(--color-brand-primary)' : 'var(--color-text-secondary)',
                      fontWeight: selectedKey === t.key ? 600 : 500,
                    }}
                  >
                    <div className="truncate">{t.name}</div>
                    <div className="text-xs font-mono opacity-70">{t.key}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Editor */}
          {selected ? (
            <TemplateEditor key={selected.key} template={selected} onSave={save} onPreview={preview.mutateAsync} />
          ) : (
            <div className="rounded-xl p-8 text-center" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)' }}>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Select a template to edit, or seed the defaults.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateEditor({
  template,
  onSave,
  onPreview,
}: {
  template: EmailTemplateDto;
  onSave: (data: EmailTemplateDto) => Promise<void>;
  onPreview: (data: { key: string; subject: string; htmlBody: string; textBody?: string | null; variables?: Record<string, unknown> }) => Promise<{ subject: string; htmlBody: string }>;
}) {
  const [draft, setDraft] = useState<EmailTemplateDto>({ ...template });
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sampleVariables = useMemo(() => {
    const vars: Record<string, unknown> = {};
    for (const v of draft.variables ?? []) vars[v.name] = v.example ?? `{{${v.name}}}`;
    return vars;
  }, [draft.variables]);

  const set = <K extends keyof EmailTemplateDto>(key: K, value: EmailTemplateDto[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const runPreview = async () => {
    try {
      const result = await onPreview({
        key: draft.key,
        subject: draft.subject,
        htmlBody: draft.htmlBody,
        textBody: draft.textBody ?? null,
        variables: sampleVariables,
      });
      setPreviewHtml(result.htmlBody);
    } catch {
      setPreviewHtml('<p>Preview unavailable.</p>');
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave({
        ...draft,
        textBody: draft.textBody || null,
        fromEmail: draft.fromEmail || null,
      });
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
    <div className="rounded-xl p-5 space-y-4" style={{ background: 'var(--color-bg-glass)', border: '1px solid var(--color-border-glass)', boxShadow: 'var(--shadow-glass)' }}>
      <div className="grid md:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Key</span>
          <span className={`${field} inline-block font-mono`} style={fieldStyle}>{draft.key}</span>
        </label>
        <label className="block text-sm">
          <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Name</span>
          <input className={field} style={fieldStyle} value={draft.name ?? ''} onChange={(e) => set('name', e.target.value)} />
        </label>
      </div>

      <label className="block text-sm">
        <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Subject</span>
        <input className={field} style={fieldStyle} value={draft.subject ?? ''} onChange={(e) => set('subject', e.target.value)} />
      </label>

      <label className="block text-sm">
        <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
          HTML body <span className="font-normal">{"{{var}} placeholders supported"}</span>
        </span>
        <textarea
          className={`${field} h-56 font-mono text-xs`}
          style={fieldStyle}
          value={draft.htmlBody ?? ''}
          onChange={(e) => set('htmlBody', e.target.value)}
        />
      </label>

      <label className="block text-sm">
        <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>Plain-text body (optional)</span>
        <textarea
          className={`${field} h-20 font-mono text-xs`}
          style={fieldStyle}
          value={draft.textBody ?? ''}
          onChange={(e) => set('textBody', e.target.value)}
        />
      </label>

      <div className="grid md:grid-cols-2 gap-4">
        <label className="block text-sm">
          <span className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>From email (optional)</span>
          <input className={field} style={fieldStyle} value={draft.fromEmail ?? ''} onChange={(e) => set('fromEmail', e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm pt-5">
          <input type="checkbox" checked={draft.active} onChange={(e) => set('active', e.target.checked)} />
          <span style={{ color: 'var(--color-text-secondary)' }}>Template active</span>
        </label>
      </div>

      {previewHtml && (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-default)' }}>
          <div className="px-3 py-2 text-xs font-semibold" style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-muted)' }}>
            Preview
          </div>
          <iframe title="Email preview" sandbox="" srcDoc={previewHtml} className="w-full h-56 bg-white" />
        </div>
      )}

      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={runPreview}
          className="px-5 py-2 text-sm font-semibold rounded-full"
          style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-brand-primary)', color: 'var(--color-brand-primary)' }}
        >
          Preview
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 py-2 text-sm font-semibold rounded-full"
          style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  );
}