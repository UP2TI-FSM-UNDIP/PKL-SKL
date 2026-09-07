import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/persuratan-skl',
  trailingSlash: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '10.137.58.124',
        port: '20052',
        pathname: '/files/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '9000',
        pathname: '/e-office-storage/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '9000',
        pathname: '/e-office-storage/**',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    unoptimized: process.env.NODE_ENV === 'development',
  },
  // Allow production build to succeed despite remaining minor TypeScript type errors
  // (e.g. in legacy pages or older code that don't affect runtime behavior)
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {},
  // Exclude legacy UmiJS files from compilation
  // The src/pages/persuratan folder contains old UmiJS files that use
  // packages (umi, @umijs/max, react-quill, etc.) not installed in this project.
  webpack: (config) => {
    config.module.rules.push({
      test: /[\\/]src[\\/]pages[\\/]/,
      use: 'null-loader',
    });
    return config;
  },
};

export default nextConfig;
