import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const environment = createEnv({
    server: {
        APP_NAME: z.string(),
        APP_ENV: z.enum(['LOCAL', 'WORK', 'RC', 'PROD']),
        FRONT_HOST: z.string(),
        FRONT_PORT: z.string().transform(Number).pipe(z.number()),
        BACK_INTERNAL_URL: z.string().url(),
        HTTP_AUTH_LOGIN: z.string().optional(),
        HTTP_AUTH_PASS: z.string().optional(),
        CACHE_PUBLIC_MAX_AGE: z.string().transform(Number).pipe(z.number()).optional(),
        SENTRY_DSN: z.string().url(),
        SENTRY_AUTH_TOKEN: z.string(),
        SENTRY_URL: z.string().url(),
        SENTRY_ORG: z.string(),
        CI: z.enum(['true', 'false']).transform(value => value === 'true'),
    },
    experimental__runtimeEnv: process.env,
    emptyStringAsUndefined: true,
});
