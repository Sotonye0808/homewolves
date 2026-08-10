import type { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://homewolves.africa';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/auth', '/messages', '/api/'],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
