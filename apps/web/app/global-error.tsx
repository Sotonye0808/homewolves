'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'var(--color-bg-canvas)' }}>
          <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-primary)' }}>
              Fatal error
            </h1>
            <p style={{ fontSize: 14, marginBottom: 24, color: 'var(--color-text-secondary)' }}>
              The application failed to load. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 600,
                background: 'var(--color-brand-accent)',
                color: 'var(--color-text-inverse)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
