import * as Sentry from '@sentry/nextjs';
import { env } from './env/server';

Sentry.init({
    dsn: env.SENTRY_DSN,
    tracesSampleRate: 0,
    autoSessionTracking: false,
    environment: `${env.APP_ENV}-edge`,
});
