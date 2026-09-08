/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hw/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudflarestorage.com' },
      { protocol: 'http', hostname: '**.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'http', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'http', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'http', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'http', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'homewolves.com' },
      { protocol: 'http', hostname: 'homewolves.com' },
      { protocol: 'https', hostname: 'www.homewolves.com' },
      { protocol: 'http', hostname: 'www.homewolves.com' },
      { protocol: 'https', hostname: '**.homewolves.com' },
      { protocol: 'http', hostname: '**.homewolves.com' },
      { protocol: 'https', hostname: 'api.homewolves.africa' },
      { protocol: 'http', hostname: 'api.homewolves.africa' },
      { protocol: 'https', hostname: '**.homewolves.africa' },
      { protocol: 'http', hostname: '**.homewolves.africa' },
      { protocol: 'https', hostname: '**.vercel.app' },
      { protocol: 'http', hostname: '**.vercel.app' },
      { protocol: 'https', hostname: 'localhost' },
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'http', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'http', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: '**.picsum.photos' },
      { protocol: 'http', hostname: '**.picsum.photos' },
    ],
    unoptimized: false,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
