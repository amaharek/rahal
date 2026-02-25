const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');

const withNextIntl = createNextIntlPlugin('./lib/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname, '..'),

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'flagcdn.com',
      },
    ],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_NAME: 'Rahal',
    NEXT_PUBLIC_APP_NAME_AR: 'رحال',
  },

  // Force single d3-selection instance to prevent duplicate module split
  // that breaks selection.interrupt (used by d3-zoom via ZoomableGroup)
  webpack: (config) => {
    config.resolve.alias['d3-selection'] = path.resolve(
      __dirname,
      'node_modules/d3-selection'
    );
    return config;
  },

  // Experimental features
  experimental: {
    // Enable server actions
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

module.exports = withNextIntl(nextConfig);
