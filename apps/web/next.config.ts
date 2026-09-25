import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@workpulse/config', '@workpulse/types'],
};

export default nextConfig;
