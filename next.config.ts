import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  allowedDevOrigins: [
    '192.168.*.*',
    '192.168.1.52',
    '10.*.*.*',
    '172.16.*.*',
    '*.local',
    'localhost',
    '127.0.0.1',
  ],
  outputFileTracingIncludes: {
    '/**': ['./prisma/dev.db', './prisma/**'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
