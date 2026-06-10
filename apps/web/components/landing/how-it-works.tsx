import { Clock, ShieldCheck, Users } from 'lucide-react';

const steps = [
  {
    icon: Clock,
    num: '01',
    heading: 'Browse & Discover',
    desc: 'Explore thousands of verified properties across Africa. Filter by location, type, price, and more.',
  },
  {
    icon: ShieldCheck,
    num: '02',
    heading: 'Verify & Connect',
    desc: 'Every listing is verified. Connect directly with trusted agents and schedule viewings instantly.',
  },
  {
    icon: Users,
    num: '03',
    heading: 'Transact Securely',
    desc: 'Close deals with confidence using our escrow-backed transaction platform. Every step is audited.',
  },
];

export function HowItWorks() {
  return (
    <section className="w-full py-16 lg:py-20 px-4 lg:px-10" aria-label="How it works">
      <div className="max-w-[1120px] mx-auto">
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-8 lg:mb-10 text-center">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <article key={step.num} className="flex flex-col items-center text-center gap-6">
                <div className="w-20 h-20 grid place-items-center bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] border border-[var(--color-border-glass)] rounded-xl text-[var(--color-brand-accent)] shadow-glass">
                  <Icon className="w-9 h-9" />
                </div>
                <div className="max-w-[300px]">
                  <div className="font-body text-xs font-semibold text-[var(--color-brand-accent)] uppercase tracking-widest mb-2">
                    {step.num}
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground leading-tight mb-3">
                    {step.heading}
                  </h3>
                  <p className="font-body text-base text-secondary leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
