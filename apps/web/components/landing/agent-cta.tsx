import { HwButton } from '@/components/ui';

export function AgentCta() {
  return (
    <section className="w-full py-16 lg:py-20 px-4 lg:px-10 bg-primary" aria-label="Agent call to action">
      <div className="max-w-[1120px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
        <div className="max-w-[560px] text-center lg:text-left">
          <h2 className="font-display text-3xl lg:text-4xl font-bold text-[var(--color-text-inverse)] leading-tight mb-4">
            Are You an Agent?
          </h2>
          <p className="font-body text-lg text-white/80 leading-relaxed">
            Join Africa&apos;s fastest-growing real estate platform. Get verified listings,
            qualified leads, and end-to-end transaction management.
          </p>
        </div>
        <div className="shrink-0">
          <HwButton variant="cta" size="xl">
            Become an Agent
          </HwButton>
        </div>
      </div>
    </section>
  );
}
