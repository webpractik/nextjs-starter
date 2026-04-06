import { isProd } from '#/constants/env'
import { clientEnvironment } from '#/env/client'
import * as Sentry from '@sentry/nextjs'

if (isProd && clientEnvironment.NEXT_PUBLIC_SENTRY_DSN) {
	Sentry.init({
		debug: false,
		dsn: clientEnvironment.NEXT_PUBLIC_SENTRY_DSN,
		environment: `${clientEnvironment.NEXT_PUBLIC_APP_ENV}-client`,
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
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
