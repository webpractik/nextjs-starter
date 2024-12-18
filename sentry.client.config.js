import * as Sentry from '@sentry/nextjs';
import { env } from './env/client';

Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    environment: `${env.NEXT_PUBLIC_APP_ENV}-client`,
    integrations: [Sentry.replayIntegration(), Sentry.reportingObserverIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
});
