import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SWC minification is always enabled in Next.js 15+

  // Image optimization configuration
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Response headers for caching and performance
  async headers() {
    return [
      {
        // Cache static JSON data files (bioregions, lookup, etc.)
        source: '/data/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, immutable',
          },
        ],
      },
      {
        // Cache static assets (fonts, images, etc.)
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
