export default function AboutPage() {
  return (
    <main className="min-h-screen px-4 py-16 lg:px-10 bg-[var(--color-bg-base)]">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-4">
          About
        </p>
        <h1 className="font-display text-4xl font-bold text-[var(--color-brand-primary)] mb-4">
          About Homewolves
        </h1>
        <p className="text-base leading-relaxed text-[var(--color-text-secondary)]">
          Homewolves is a Nigeria-first property marketplace built to help buyers, agents,
          homeowners, and developers discover verified listings and close transactions with less
          friction.
        </p>
      </div>
    </main>
  );
}
