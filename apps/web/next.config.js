/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@hw/types'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
    ],
  },
};

module.exports = nextConfig;
