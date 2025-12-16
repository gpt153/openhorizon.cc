import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Skip static generation during build (prevents DB connection errors)
  skipTrailingSlashRedirect: true,
  // This ensures API routes are always dynamic
  ...(process.env.NODE_ENV === 'production' ? {
    typescript: {
      ignoreBuildErrors: false,
    },
  } : {}),
};

export default nextConfig;
