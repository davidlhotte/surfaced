/**
 * Sentry Server-side Configuration
 *
 * This file configures the initialization of Sentry for the server-side.
 * The config you add here will be used whenever the server handles a request.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Set the sample rate for error events
    // Adjust this value in production based on your needs
    sampleRate: 1.0,

    // Set tracesSampleRate to capture performance data
    // Adjust this value in production (e.g., 0.1 for 10% of transactions)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: process.env.NODE_ENV === 'development',

    // Environment tag for filtering in Sentry dashboard
    environment: process.env.NODE_ENV || 'development',

    // Only enable in production or when explicitly set
    enabled: process.env.NODE_ENV === 'production' || !!process.env.SENTRY_DSN,

    // Customize which errors to ignore
    ignoreErrors: [
      // Ignore common non-critical errors
      'ResizeObserver loop limit exceeded',
      'Network request failed',
      'Load failed',
      // Rate limit errors are expected behavior
      'Rate limit exceeded',
    ],

    // Add custom tags to all events
    initialScope: {
      tags: {
        app: 'locateus',
        runtime: 'server',
      },
    },

    // Capture unhandled promise rejections
    integrations: [
      Sentry.captureConsoleIntegration({
        levels: ['error'],
      }),
    ],
  });
}
