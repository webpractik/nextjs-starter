import * as Sentry from '@sentry/nextjs';
import { registerOTel } from '@vercel/otel';
import { environment } from '#/env/server';

export const onRequestError = Sentry.captureRequestError;

export function register() {
    registerOTel({ serviceName: environment.APP_NAME });

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        Sentry.init({
            dsn: environment.SENTRY_DSN,
            environment: `${environment.APP_ENV}-server`,
            tracesSampleRate: 1,
        });
    }

    if (process.env.NEXT_RUNTIME === 'edge') {
        Sentry.init({
            dsn: environment.SENTRY_DSN,
            environment: `${environment.APP_ENV}-edge`,
            sampleRate: 0,
            tracesSampleRate: 0,
        });
    }
}
