import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg-canvas)' }}>
      <div className="max-w-md w-full text-center">
        <div className="text-5xl mb-4">🔍</div>
        <h1 className="text-2xl font-semibold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}>
          Page not found
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2 rounded-full text-sm font-semibold"
          style={{ background: 'var(--color-brand-accent)', color: 'var(--color-text-inverse)' }}
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
