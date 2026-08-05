import { createEnv } from '@t3-oss/env-nextjs'
import { z } from 'zod'

import { apiBaseUrlSchema, cacheNamespaceSchema, valkeyUrlSchema } from './schemas'

export const serverEnvironment = createEnv({
    emptyStringAsUndefined: true,
    experimental__runtimeEnv: process.env,
    server: {
        APP_ENV: z.enum(['LOCAL', 'WORK', 'RC', 'PROD']),
        APP_NAME: z.string(),
        BACK_INTERNAL_URL: apiBaseUrlSchema,
        CACHE_PROBE_ENABLED: z.stringbool().default(false),
        CACHE_PROBE_TOKEN: z.string().min(32).max(256).optional(),
        CI: z.enum(['true', 'false']).transform((value) => value === 'true'),
        FRONT_HOST: z.string(),
        PORT: z.string().transform(Number).pipe(z.number()),
        HTTP_AUTH_LOGIN: z.string().optional(),
        HTTP_AUTH_PASS: z.string().optional(),
        MOCK_MODE: z.stringbool().default(false),
        SENTRY_AUTH_TOKEN: z.string(),
        SENTRY_DSN: z.url(),
        SENTRY_ORG: z.string(),
        SENTRY_URL: z.url(),
        VALKEY_CACHE_MAX_ENTRY_BYTES: z.coerce.number().int().positive().default(1_048_576),
        VALKEY_CACHE_MAX_TTL_SECONDS: z.coerce.number().int().positive().default(86_400),
        VALKEY_CACHE_NAMESPACE: cacheNamespaceSchema,
        VALKEY_URL: valkeyUrlSchema,
    },
})
