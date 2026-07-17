import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const baseConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'api.slingacademy.com',            port: '' },
      { protocol: 'https', hostname: 'res.cloudinary.com',              port: '' },
      { protocol: 'https', hostname: '*.r2.dev',                        port: '' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com',      port: '' },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24h cache for optimized images
  },
  transpilePackages: ['geist'],
  
  // This helps Next.js ignore the missing trace files during the Vercel build
  outputFileTracingExcludes: {
    '*': [
      'node_modules/@swc/core-linux-x64-gnu',
      'node_modules/@swc/core-linux-x64-musl',
    ],
  },
};

const isSentryConfigured =
  process.env.NEXT_PUBLIC_SENTRY_DISABLED !== 'true' &&
  !!process.env.NEXT_PUBLIC_SENTRY_DSN &&
  !!process.env.NEXT_PUBLIC_SENTRY_ORG &&
  !!process.env.NEXT_PUBLIC_SENTRY_PROJECT;

const nextConfig = isSentryConfigured
  ? withSentryConfig(baseConfig, {
      org: process.env.NEXT_PUBLIC_SENTRY_ORG,
      project: process.env.NEXT_PUBLIC_SENTRY_PROJECT,
      
      // BUILD SETTINGS
      silent: !process.env.CI,
      widenClientFileUpload: true,
      
      // NEW V8+ SYNTAX:
      sourcemaps: {
        disable: true, // This stops the generation of local maps that crash the build
        // Or if you want maps but no errors:
        // deleteSourcemapsAfterUpload: true,
      },

      reactComponentAnnotation: { enabled: true },
      tunnelRoute: '/monitoring',
      disableLogger: true,
    })
  : baseConfig;

export default nextConfig;