import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@devtunnel/ui', '@devtunnel/shared'],
};

export default nextConfig;
