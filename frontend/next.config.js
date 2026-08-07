/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  images: {
    domains: ["unpkg.com", "tile.openstreetmap.org"],
  },

  eslint: {
    ignoreDuringBuilds: true,
  },

  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

module.exports = nextConfig;