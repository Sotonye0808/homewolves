'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorBoundary({
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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg-canvas)' }}>
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-4">⚠️</div>
        <h1 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
          Something went wrong
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={reset}
            className="px-5 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2 rounded-full text-sm font-semibold"
            style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
