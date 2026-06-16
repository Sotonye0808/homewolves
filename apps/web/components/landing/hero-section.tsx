'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight } from 'lucide-react';

export function HeroSection() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  return (
    <section className="relative w-full h-[500px] lg:h-[600px] overflow-hidden" role="banner">
      <img
        src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=2560&q=80"
        alt="Beautiful African property"
        className="w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/65" />
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-16 lg:pb-20 px-4 lg:px-10">
        <h1 className="font-display text-hero font-bold text-[var(--color-text-inverse)] leading-tight text-center max-w-[800px] mb-4">
          Discover Your Next Home in Africa
        </h1>
        <p className="font-body text-lg text-white/85 leading-snug text-center max-w-[560px] mb-8">
          Verified properties, trusted agents, and seamless transactions across the continent.
        </p>
        <div
          className="flex items-center gap-3 bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur)] border border-[var(--color-border-glass)] rounded-full px-6 py-3 shadow-glass w-full max-w-[560px]"
          role="search"
        >
          <Search className="w-5 h-5 text-white/70 shrink-0" />
          <input
            type="text"
            placeholder="Search by city, property type, or agent..."
            aria-label="Search properties"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                router.push(
                  query.trim()
                    ? `/properties?search=${encodeURIComponent(query.trim())}`
                    : '/properties',
                );
              }
            }}
            className="flex-1 bg-transparent border-none outline-none font-body text-base text-[var(--color-text-inverse)] placeholder:text-white/55 py-2"
          />
          <button
            type="button"
            onClick={() =>
              router.push(
                query.trim()
                  ? `/properties?search=${encodeURIComponent(query.trim())}`
                  : '/properties',
              )
            }
            className="flex items-center gap-2 px-6 py-2 border-none rounded-full bg-accent text-accent-foreground font-body text-base font-semibold shrink-0 hover:bg-[var(--color-brand-accent-alt)] transition-colors duration-fast"
          >
            Search
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}
