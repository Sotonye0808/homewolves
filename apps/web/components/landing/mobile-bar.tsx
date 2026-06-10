'use client';

import { useState } from 'react';
import { Home, Search, MessageCircle, User, Plus } from 'lucide-react';

const tabs = [
  { label: 'Explore', icon: Home, aria: 'Explore properties' },
  { label: 'Search', icon: Search, aria: 'Search properties' },
  { label: 'Chat', icon: MessageCircle, aria: 'Messages' },
  { label: 'Profile', icon: User, aria: 'Profile' },
];

export function MobileBar() {
  const [active, setActive] = useState(0);

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-[200] h-20 pb-[10px] bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-heavy)] border-t border-[var(--color-border-glass)] flex items-center justify-around shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
      role="navigation"
      aria-label="Bottom navigation"
    >
      {tabs.map((tab, i) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.label}
            type="button"
            aria-label={tab.aria}
            data-state={active === i ? 'active' : ''}
            className={`flex flex-col items-center gap-0.5 bg-none border-none px-3 py-1 font-body text-[10px] font-semibold transition-colors duration-fast ${
              active === i
                ? 'text-accent'
                : 'text-muted-foreground'
            }`}
            onClick={() => setActive(i)}
          >
            <Icon className="w-[22px] h-[22px]" />
            {tab.label}
          </button>
        );
      })}

      <button
        type="button"
        aria-label="Post property"
        className="w-14 h-14 border-none rounded-full bg-accent text-accent-foreground grid place-items-center shadow-xl -mt-5 transition-transform duration-normal ease-spring active:scale-95"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>
    </nav>
  );
}
