import * as Sentry from '@sentry/nextjs';
import { env } from './env/client';

Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    autoSessionTracking: false,
    environment: `${env.SENTRY_PROJECT}-client`,
});
