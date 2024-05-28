import * as Sentry from '@sentry/nextjs';

import { environment } from './env/server';

export function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        Sentry.init({
            dsn: environment.SENTRY_DSN,
            tracesSampleRate: 1,
            autoSessionTracking: false,
            environment: `${environment.APP_ENV}-server`,
        });
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        Sentry.init({
            dsn: environment.SENTRY_DSN,
            tracesSampleRate: 0,
            autoSessionTracking: false,
            environment: `${environment.APP_ENV}-edge`,
        });
    }
}
