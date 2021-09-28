import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  autoSessionTracking: false,
  environment: `${process.env.APP_ENV}-client`,
});
