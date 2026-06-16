'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Bell } from 'lucide-react';
import { HwButton } from '@/components/ui';

export function TopNav() {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-1/2 -translate-x-1/2 z-[100] w-full max-w-[var(--bp-3xl,1920px)] h-14 lg:h-16 flex items-center justify-between px-4 lg:px-10 transition-[background] duration-normal ease-default ${
        scrolled
          ? 'bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur)] border-b border-[var(--color-border-glass)]'
          : 'bg-transparent'
      }`}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center gap-6">
        <Link
          href="/"
          className={`font-display text-2xl font-bold tracking-tight transition-colors duration-normal ${
            scrolled ? 'text-[var(--color-brand-primary)]' : 'text-[var(--color-text-inverse)]'
          }`}
        >
          Homewolves
        </Link>

        <div
          className="hidden lg:flex items-center gap-2 bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] border border-[var(--color-border-glass)] rounded-full px-4 py-1 w-[320px] focus-within:w-[400px] transition-[width] duration-normal ease-default"
          role="search"
        >
          <Search className="w-4 h-4 text-[var(--color-text-muted)] shrink-0" />
          <input
            type="text"
            placeholder="Search properties..."
            aria-label="Search properties"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                router.push(
                  searchQuery.trim()
                    ? `/properties?search=${encodeURIComponent(searchQuery.trim())}`
                    : '/properties',
                );
              }
            }}
            className={`flex-1 bg-transparent border-none outline-none font-body text-sm py-1 placeholder:transition-colors ${
              scrolled
                ? 'text-foreground placeholder:text-muted-foreground'
                : 'text-[var(--color-text-inverse)] placeholder:text-white/50'
            }`}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <a
          href="/pricing"
          className={`hidden lg:inline-flex text-sm font-semibold transition-colors ${
            scrolled
              ? 'text-[var(--color-text-secondary)] hover:text-[var(--color-brand-primary)]'
              : 'text-white/80 hover:text-white'
          }`}
        >
          Pricing
        </a>
        <HwButton
          variant="primary"
          size="sm"
          className="hidden lg:inline-flex"
          onClick={() => router.push('/dashboard/agent/listings/new')}
        >
          Post Property
        </HwButton>

        <Link
          href="/dashboard/notifications"
          aria-label="Notifications"
          className={`w-10 h-10 rounded-full grid place-items-center transition-colors duration-fast ${
            scrolled
              ? 'text-foreground hover:bg-[var(--color-border-subtle)]'
              : 'text-[var(--color-text-inverse)] hover:bg-white/10'
          }`}
        >
          <Bell className="w-5 h-5" />
        </Link>

        <Link
          href="/dashboard/client"
          className="w-9 h-9 rounded-full bg-accent grid place-items-center text-inverse text-xs font-semibold border-2 border-transparent hover:border-accent transition-colors duration-fast"
          aria-label="Profile"
        >
          HW
        </Link>
      </div>
    </nav>
  );
}
