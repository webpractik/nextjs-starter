import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'

import { serverEnvironment } from '#/env/server'

export const onRequestError = Sentry.captureRequestError

export function register() {
    registerOTel({ serviceName: serverEnvironment.APP_NAME })

    if (process.env.NEXT_RUNTIME === 'nodejs') {
        Sentry.init({
            dsn: serverEnvironment.SENTRY_DSN,
            environment: `${serverEnvironment.APP_ENV}-server`,
            tracesSampleRate: 1,
        })
    }
}
