const faqs = [
  {
    q: 'How do I search for properties?',
    a: 'Use the properties feed or the home page search bar to filter by city, type, or agent.',
  },
  {
    q: 'Can I post a property as an agent?',
    a: 'Yes. Use the Post Property action to go straight to the listing creation flow.',
  },
  {
    q: 'Do I need an account to browse?',
    a: 'No. Guests can browse and view public listings without logging in.',
  },
];

export default function FaqPage() {
  return (
    <main className="min-h-screen px-4 py-16 lg:px-10 bg-[var(--color-bg-base)]">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--color-text-muted)] mb-4">
          FAQ
        </p>
        <h1 className="font-display text-4xl font-bold text-[var(--color-brand-primary)] mb-6">
          Frequently Asked Questions
        </h1>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <section
              key={faq.q}
              className="rounded-2xl border border-[var(--color-border-glass)] bg-[var(--color-bg-glass)] p-5 backdrop-blur-[var(--glass-blur)]"
            >
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-2">{faq.q}</h2>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{faq.a}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
