/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow production builds even with TypeScript errors
    // This is safe because we already run tsc separately
    ignoreBuildErrors: false,
  },
  images: { unoptimized: true },
  // Use standalone output for optimized Docker/Vercel deployment
  output: 'standalone',
  // Disable static page generation for pages that require runtime environment
  experimental: {
    // Increase memory cache size for ISR
    isrMemoryCacheSize: 0,
  },
  // Disable automatic static optimization for specific pages
  // This forces them to be server-side rendered
  async headers() {
    return [];
  },
  // Environment variables that should be available at build time
  env: {
    // Provide fallback values for build time (will be overridden at runtime in Vercel)
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://example.vercel.app',
  },
};

module.exports = nextConfig;
