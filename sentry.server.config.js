import * as Sentry from '@sentry/nextjs';
import { env } from './config/env.mjs';

Sentry.init({
    dsn: env.SENTRY_DSN || env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1.0,
    autoSessionTracking: false,
    environment: `${env.APP_ENV}-server`,
});
