import { Home, Building2, Users, Mountain, Compass, PenTool } from 'lucide-react';

const categories = [
  { label: 'For Sale', icon: Home, category: 'sale' },
  { label: 'For Rent', icon: Building2, category: 'rent' },
  { label: 'Shortlet', icon: Users, category: 'shortlet' },
  { label: 'Land', icon: Mountain, category: 'land' },
  { label: 'New Dev', icon: Compass, category: 'new-dev' },
  { label: 'Direct Brief', icon: PenTool, category: 'direct-brief' },
];

export function CategoryBento() {
  return (
    <section className="w-full py-16 lg:py-20 px-4 lg:px-10" aria-label="Property categories">
      <div className="max-w-[1120px] mx-auto">
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-8 lg:mb-10">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
          {categories.map((cat) => {
            const Icon = cat.icon;
            return (
              <article
                key={cat.category}
                className="bg-[var(--color-bg-glass)] backdrop-blur-[var(--glass-blur-subtle)] border border-[var(--color-border-glass)] rounded-xl p-6 lg:p-8 flex items-center gap-5 shadow-card cursor-pointer transition-transform duration-normal ease-out hover:-translate-y-1 hover:shadow-hover"
                role="button"
                tabIndex={0}
                data-category={cat.category}
              >
                <div className="w-12 h-12 lg:w-14 lg:h-14 shrink-0 grid place-items-center bg-primary rounded-md text-primary-foreground">
                  <Icon className="w-6 h-6 lg:w-7 lg:h-7" />
                </div>
                <span className="font-body text-base lg:text-lg font-semibold text-foreground">
                  {cat.label}
                </span>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
