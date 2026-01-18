import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // Disable telemetry in production
  ...(process.env.NODE_ENV === 'production' ? {
    typescript: {
      ignoreBuildErrors: false,
    },
  } : {}),
};

export default nextConfig;
