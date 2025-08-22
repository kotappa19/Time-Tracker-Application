import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Handle Firebase and other external dependencies
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Ensure proper environment variable handling
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Optimize for production
  swcMinify: true,
  compress: true,
};

export default nextConfig;
