import { environment } from '#/env/client'
import * as Sentry from '@sentry/nextjs'

Sentry.init({
	debug: false,
	dsn: environment.NEXT_PUBLIC_SENTRY_DSN,
	environment: `${environment.NEXT_PUBLIC_APP_ENV}-client`,
	// Вкл при необходимости, раздувает общий бандл
	// integrations: [
	//     Sentry.replayIntegration({ blockAllMedia: true, maskAllText: true }),
	//     Sentry.reportingObserverIntegration(),
	// ],
	replaysOnErrorSampleRate: 1,
	replaysSessionSampleRate: 0.1,
	sendDefaultPii: true,
	tracesSampleRate: 1,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
