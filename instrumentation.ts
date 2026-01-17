import { environment } from '#/env/server'
import * as Sentry from '@sentry/nextjs'
import { registerOTel } from '@vercel/otel'

export const onRequestError = Sentry.captureRequestError

export function register() {
	registerOTel({ serviceName: environment.APP_NAME })

	if (process.env.NEXT_RUNTIME === 'nodejs') {
		Sentry.init({
			dsn: environment.SENTRY_DSN,
			environment: `${environment.APP_ENV}-server`,
			tracesSampleRate: 1,
		})
	}
}
