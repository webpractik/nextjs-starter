import * as Sentry from '@sentry/nextjs';
import { env } from './env/client';

Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.5,
    autoSessionTracking: false,
    environment: `${env.NEXT_PUBLIC_APP_ENV}-client`,
});
