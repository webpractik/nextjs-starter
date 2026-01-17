import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

export const environment = createEnv({
	emptyStringAsUndefined: true,
	experimental__runtimeEnv: process.env,
	server: {
		APP_ENV: z.enum(['LOCAL', 'WORK', 'RC', 'PROD']),
		APP_NAME: z.string(),
		BACK_INTERNAL_URL: z.url(),
		CI: z.enum(['true', 'false']).transform(value => value === 'true'),
		FRONT_HOST: z.string(),
		FRONT_PORT: z.string().transform(Number).pipe(z.number()),
		HTTP_AUTH_LOGIN: z.string().optional(),
		HTTP_AUTH_PASS: z.string().optional(),
		SENTRY_AUTH_TOKEN: z.string(),
		SENTRY_DSN: z.url(),
		SENTRY_ORG: z.string(),
		SENTRY_URL: z.url(),
	},
})
