import * as Sentry from '@sentry/nextjs';
import { env } from './src/env/client';

Sentry.init({
    dsn: env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 1,
    environment: `${env.NEXT_PUBLIC_APP_ENV}-client`,
    debug: false,
    integrations: [
        Sentry.replayIntegration({
            maskAllText: true,
            blockAllMedia: true,
        }),
        Sentry.reportingObserverIntegration(),
        Sentry.browserTracingIntegration(),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
});
