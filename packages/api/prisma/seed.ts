import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FALLBACK_AMENITIES = [
  { id: 'parking', label: 'Parking', icon: 'Car', active: true, display_order: 1 },
  { id: 'swimming-pool', label: 'Swimming Pool', icon: 'Pool', active: true, display_order: 2 },
  { id: 'security', label: '24/7 Security', icon: 'Shield', active: true, display_order: 3 },
  { id: 'generator', label: 'Generator', icon: 'Zap', active: true, display_order: 4 },
  { id: 'wifi', label: 'Wi-Fi', icon: 'Wifi', active: true, display_order: 5 },
  { id: 'cctv', label: 'CCTV', icon: 'Camera', active: true, display_order: 6 },
  { id: 'water-supply', label: 'Water Supply', icon: 'Droplets', active: true, display_order: 7 },
  { id: 'serviced', label: 'Serviced', icon: 'Tool', active: true, display_order: 8 },
  { id: 'gym', label: 'Gym', icon: 'Dumbbell', active: true, display_order: 9 },
  { id: 'elevator', label: 'Elevator', icon: 'ArrowUpDown', active: true, display_order: 10 },
];

const FALLBACK_FILTER_PILLS = [
  { id: 'all', label: 'All', query_param: '', active: true, display_order: 1 },
  { id: 'for-sale', label: 'For Sale', query_param: 'category=SALE', active: true, display_order: 2 },
  { id: 'rent', label: 'Rent', query_param: 'category=RENT', active: true, display_order: 3 },
  { id: 'shortlet', label: 'Shortlet', query_param: 'category=SHORTLET', active: true, display_order: 4 },
  { id: 'land', label: 'Land', query_param: 'category=LAND', active: true, display_order: 5 },
  { id: 'new-development', label: 'New Development', query_param: 'propertyType=new-dev', active: true, display_order: 6 },
  { id: 'furnished', label: 'Furnished', query_param: 'furnished=true', active: true, display_order: 7 },
  { id: 'verified', label: 'Verified', query_param: 'verified=true', active: true, display_order: 8 },
];

const FALLBACK_NAV_ITEMS = [
  { id: 'home', label: 'Home', path: '/', icon: 'Home', roles: ['GUEST', 'BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER', 'ADMIN'], active: true, display_order: 1 },
  { id: 'properties', label: 'Properties', path: '/properties', icon: 'Building2', roles: ['GUEST', 'BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER', 'ADMIN'], active: true, display_order: 2 },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard/agent', icon: 'LayoutDashboard', roles: ['AGENT', 'DEVELOPER', 'ADMIN'], active: true, display_order: 3 },
  { id: 'transactions', label: 'Transactions', path: '/transactions', icon: 'ArrowLeftRight', roles: ['AGENT', 'BUYER', 'ADMIN'], active: true, display_order: 4 },
  { id: 'messages', label: 'Messages', path: '/messages', icon: 'MessageCircle', roles: ['AGENT', 'BUYER', 'ADMIN'], active: true, display_order: 5 },
  { id: 'admin', label: 'Admin', path: '/admin', icon: 'Shield', roles: ['ADMIN', 'SUPER_ADMIN'], active: true, display_order: 6 },
];

const FALLBACK_PROPERTY_TYPES = [
  { id: 'apartment', label: 'Apartment', icon: 'Building', active: true, display_order: 1 },
  { id: 'house', label: 'House', icon: 'Home', active: true, display_order: 2 },
  { id: 'duplex', label: 'Duplex', icon: 'Building2', active: true, display_order: 3 },
  { id: 'terrace', label: 'Terrace', icon: 'Rows', active: true, display_order: 4 },
  { id: 'bungalow', label: 'Bungalow', icon: 'Home', active: true, display_order: 5 },
  { id: 'penthouse', label: 'Penthouse', icon: 'Building', active: true, display_order: 6 },
  { id: 'studio', label: 'Studio', icon: 'Door', active: true, display_order: 7 },
  { id: 'warehouse', label: 'Warehouse', icon: 'Warehouse', active: true, display_order: 8 },
  { id: 'commercial', label: 'Commercial', icon: 'Store', active: true, display_order: 9 },
];

const FALLBACK_FEATURE_FLAGS = [
  { id: 'map_view', enabled: true, rollout_percentage: 100, roles: ['GUEST', 'BUYER', 'AGENT', 'DEVELOPER', 'HOMEOWNER', 'ADMIN'] },
  { id: 'ai_chatbot', enabled: false, rollout_percentage: 0, roles: ['AGENT', 'ADMIN'] },
  { id: 'e_signature', enabled: false, rollout_percentage: 0, roles: ['AGENT', 'BUYER', 'ADMIN'] },
  { id: 'whatsapp_integration', enabled: true, rollout_percentage: 100, roles: ['AGENT', 'BUYER'] },
  { id: 'referral_system', enabled: true, rollout_percentage: 100, roles: ['AGENT', 'DEVELOPER'] },
];

async function seedConfig() {
  const adminId = 'seed-system';

  const seeds: { key: string; value: unknown }[] = [
    { key: 'amenities', value: FALLBACK_AMENITIES },
    { key: 'filter_pills', value: FALLBACK_FILTER_PILLS },
    { key: 'nav_items', value: FALLBACK_NAV_ITEMS },
    { key: 'property_types', value: FALLBACK_PROPERTY_TYPES },
    { key: 'feature_flags', value: FALLBACK_FEATURE_FLAGS },
    { key: 'hero_content', value: {
      headline: 'Discover Your Next Home in Africa',
      subheadline: 'Verified properties, trusted agents, and seamless transactions across the continent.',
      backgroundImage: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=2560&q=80',
    }},
    { key: 'stats', value: [
      { value: '12,000+', label: 'Listings' },
      { value: '1,500+', label: 'Agents' },
      { value: '₦85B+', label: 'Deals Closed' },
    ]},
  ];

  for (const seed of seeds) {
    await prisma.platformConfig.upsert({
      where: { key: seed.key },
      update: { value: seed.value as Record<string, unknown>, updatedById: adminId },
      create: { key: seed.key, value: seed.value as Record<string, unknown>, updatedById: adminId },
    });
  }

  console.log('PlatformConfig seeded successfully.');
}

async function main() {
  await seedConfig();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
