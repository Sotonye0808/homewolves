export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-16 lg:px-10 bg-[var(--color-bg-base)]">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-4">
          Privacy
        </p>
        <h1 className="font-display text-4xl font-bold text-[var(--color-brand-primary)] mb-4">
          Privacy Policy
        </h1>
        <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
          This placeholder page exists so the auth flow and footer links route to a valid
          destination. Replace it with the full legal policy when ready.
        </p>
      </div>
    </main>
  );
}
