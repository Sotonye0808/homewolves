'use client';

import { useRef, useState, useCallback } from 'react';

/**
 * Lightweight dependency-free rich-text editor for admin content.
 * Values are HTML strings; editing happens in a contenteditable box with a
 * small formatting toolbar, plus an optional HTML source mode for advanced
 * authors. Keeps the admin flow self-contained (no third-party editor deps).
 */
export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [source, setSource] = useState(value);

  const exec = useCallback(
    (command: string, arg?: string) => {
      ref.current?.focus();
      document.execCommand(command, false, arg);
      if (ref.current) onChange(ref.current.innerHTML);
    },
    [onChange],
  );

  const toolbar = [
    {
      label: 'Bold',
      title: 'Bold',
      action: () => exec('bold'),
      render: <b>B</b>,
    },
    {
      label: 'Italic',
      title: 'Italic',
      action: () => exec('italic'),
      render: <i>I</i>,
    },
    {
      label: 'Heading',
      title: 'Heading 2',
      action: () => exec('formatBlock', '<h2>'),
      render: 'H2',
    },
    {
      label: 'Bulleted list',
      title: 'Bulleted list',
      action: () => exec('insertUnorderedList'),
      render: '• List',
    },
    {
      label: 'Numbered list',
      title: 'Numbered list',
      action: () => exec('insertOrderedList'),
      render: '1. List',
    },
    {
      label: 'Add link',
      title: 'Add link',
      action: () => {
        const url = window.prompt('Link URL', 'https://');
        if (url) exec('createLink', url);
      },
      render: 'Link',
    },
    {
      label: 'Remove link',
      title: 'Remove link',
      action: () => exec('unlink'),
      render: 'Unlink',
    },
  ];

  const switchToSource = () => {
    setSource(ref.current?.innerHTML ?? value);
    setSourceMode(true);
  };

  const switchToWysiwyg = () => {
    setSourceMode(false);
    if (ref.current) {
      ref.current.innerHTML = source;
      onChange(source);
    }
  };

  return (
    <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border-default)' }}>
      <div className="flex flex-wrap items-center gap-1 px-2 py-1.5" style={{ background: 'var(--color-bg-base)', borderBottom: '1px solid var(--color-border-subtle)' }}>
        {toolbar.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={t.action}
            className="px-2.5 py-1 text-sm rounded-md transition-colors hover:bg-black/5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {t.render}
          </button>
        ))}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => (sourceMode ? switchToWysiwyg() : switchToSource())}
          className="px-2.5 py-1 text-xs rounded-md transition-colors"
          style={{
            background: sourceMode ? 'var(--color-bg-elevated)' : 'transparent',
            color: sourceMode ? 'var(--color-brand-primary)' : 'var(--color-text-muted)',
            fontWeight: 600,
          }}
        >
          {sourceMode ? 'Visual' : 'HTML'}
        </button>
      </div>

      {sourceMode ? (
        <textarea
          value={source}
          onChange={(e) => {
            setSource(e.target.value);
            onChange(e.target.value);
          }}
          className="w-full h-64 px-3 py-2 text-xs font-mono focus:outline-none"
          style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
          aria-label="HTML source"
        />
      ) : (
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          dangerouslySetInnerHTML={{ __html: value }}
          onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
          className="prose prose-sm max-w-none w-full min-h-[200px] px-4 py-3 text-sm focus:outline-none"
          style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)' }}
          data-testid="rich-text-editor"
        />
      )}
    </div>
  );
}