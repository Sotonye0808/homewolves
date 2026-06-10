import { Bookmark, Share2 } from 'lucide-react';
import { HwBadge } from '@/components/ui';

interface PropertyCardProps {
  image: string;
  imageAlt: string;
  price: string;
  meta: string;
  badge: { label: string; variant: 'sale' | 'rent' | 'verified' };
  verified?: boolean;
  agent: string;
}

export function PropertyCard({
  image,
  imageAlt,
  price,
  meta,
  badge,
  verified,
  agent,
}: PropertyCardProps) {
  return (
    <article className="rounded-lg overflow-hidden bg-[var(--color-bg-elevated)] border border-[var(--color-border-subtle)] shadow-card transition-all duration-normal ease-out hover:-translate-y-1.5 hover:shadow-hover">
      <div className="relative w-full aspect-video overflow-hidden group">
        <img
          src={image}
          alt={imageAlt}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-slow ease-smooth group-hover:scale-104"
        />
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            type="button"
            aria-label="Save property"
            className="w-9 h-9 border-none rounded-full bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] border border-[var(--color-border-glass)] text-[var(--color-text-inverse)] grid place-items-center transition-colors duration-fast hover:bg-[var(--color-bg-glass-dark)]"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            type="button"
            aria-label="Share property"
            className="w-9 h-9 border-none rounded-full bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] border border-[var(--color-border-glass)] text-[var(--color-text-inverse)] grid place-items-center transition-colors duration-fast hover:bg-[var(--color-bg-glass-dark)]"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] border-t border-[var(--color-border-glass)] px-5 py-4">
        <div className="font-display text-2xl font-bold text-[var(--color-text-accent)] leading-tight">
          {price}
        </div>
        <div className="font-body text-sm text-muted-foreground mt-1">{meta}</div>
        <div className="flex items-center gap-3 mt-3">
          <HwBadge variant={badge.variant}>{badge.label}</HwBadge>
          {verified && <HwBadge variant="verified">Verified</HwBadge>}
        </div>
      </div>

      <div className="flex items-center justify-between px-5 py-4">
        <span className="font-body text-sm text-secondary">{agent}</span>
        <button
          type="button"
          className="font-body text-sm font-semibold text-secondary bg-none border-none px-3 py-1 rounded-full hover:bg-[var(--color-border-subtle)] transition-colors duration-fast"
        >
          Chat
        </button>
      </div>
    </article>
  );
}
