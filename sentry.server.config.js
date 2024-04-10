import * as Sentry from '@sentry/nextjs';
import { env } from './env/server';

Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    autoSessionTracking: false,
    environment: `${env.APP_ENV}-server`,
});
