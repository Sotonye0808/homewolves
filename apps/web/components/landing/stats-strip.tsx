const stats = [
  { value: '12,000+', label: 'Listings' },
  { value: '1,500+', label: 'Agents' },
  { value: '₦85B+', label: 'Deals Closed' },
];

export function StatsStrip() {
  return (
    <section
      className="w-full py-8 px-4 lg:px-10 bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur)] border-b border-[var(--color-border-glass)]"
      aria-label="Platform statistics"
    >
      <div className="max-w-[960px] mx-auto flex justify-between items-center">
        {stats.map((s) => (
          <div key={s.label} className="text-center flex-1">
            <div className="font-display text-2xl lg:text-3xl font-bold text-[var(--color-text-accent)] leading-tight">
              {s.value}
            </div>
            <div className="font-body text-xs lg:text-sm font-semibold text-muted-foreground tracking-wide uppercase mt-2">
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
