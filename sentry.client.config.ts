/**
 * Sentry Client-side Configuration
 *
 * This file configures the initialization of Sentry for the client-side.
 * The config you add here will be used whenever a page is visited.
 * https://docs.sentry.io/platforms/javascript/guides/nextjs/
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,

    // Set the sample rate for error events
    sampleRate: 1.0,

    // Set tracesSampleRate to capture performance data
    // Adjust this value in production (e.g., 0.1 for 10% of transactions)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,

    // Environment tag for filtering in Sentry dashboard
    environment: process.env.NODE_ENV || 'development',

    // Only enable in production or when DSN is explicitly set
    enabled: process.env.NODE_ENV === 'production' || !!SENTRY_DSN,

    // Replay configuration for session replay (optional feature)
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 1.0 : 0,

    // Customize which errors to ignore
    ignoreErrors: [
      // Ignore common browser errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Network request failed',
      'Load failed',
      'ChunkLoadError',
      // Ignore cancelled requests
      'AbortError',
      'The operation was aborted',
      // Shopify App Bridge errors that are handled
      'App Bridge',
    ],

    // Add custom tags to all events
    initialScope: {
      tags: {
        app: 'locateus',
        runtime: 'client',
      },
    },

    // Capture breadcrumbs for better context
    integrations: [
      Sentry.breadcrumbsIntegration({
        console: true,
        dom: true,
        fetch: true,
        history: true,
        xhr: true,
      }),
      Sentry.browserTracingIntegration(),
    ],
  });
}
