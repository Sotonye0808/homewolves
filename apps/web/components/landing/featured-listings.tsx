import { PropertyCard } from './property-card';

const listings = [
  {
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
    imageAlt: 'Modern villa with pool',
    price: '₦120M',
    meta: '4-Bed Duplex · Ikoyi, Lagos',
    badge: { label: 'For Sale', variant: 'sale' as const },
    verified: true,
    agent: 'Maryam Abubakar · Knight Frank',
  },
  {
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80',
    imageAlt: 'Luxury apartment interior',
    price: '₦4.5M/yr',
    meta: '3-Bed Apartment · Victoria Island',
    badge: { label: 'For Rent', variant: 'rent' as const },
    verified: false,
    agent: 'James Okafor · Fine & Country',
  },
  {
    image: 'https://images.unsplash.com/photo-1600607688961-a5bf58b5b2fc?w=800&q=80',
    imageAlt: 'Contemporary living room',
    price: '₦85M',
    meta: '3-Bed Terrace · Lekki Phase 1',
    badge: { label: 'For Sale', variant: 'sale' as const },
    verified: true,
    agent: 'Chioma Eze · Remax Nigeria',
  },
];

export function FeaturedListings() {
  return (
    <section className="w-full py-16 lg:py-20 px-4 lg:px-10" aria-label="Featured listings">
      <div className="max-w-[1120px] mx-auto">
        <h2 className="font-display text-2xl lg:text-3xl font-bold text-foreground leading-tight mb-8 lg:mb-10">
          Featured Properties
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((p, i) => (
            <PropertyCard key={i} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}
