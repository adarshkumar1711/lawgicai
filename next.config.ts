import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: [
      '@google-cloud/vertexai',
      'langchain',
      'pdf-parse',
      'tesseract.js',
      '@qdrant/js-client-rest'
    ],
  },
  env: {
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  },
  webpack: (config, { isServer }) => {
    // Ignore problematic files that may contain test data
    config.resolve.alias = {
      ...config.resolve.alias,
      'sharp$': false,
      'canvas$': false,
    };

    // Add fallbacks for node modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      os: false,
    };

    return config;
  },
};

export default nextConfig;