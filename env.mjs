import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

const emptyStringToUndefined = z.literal('').transform(() => undefined);

function asOptionalField(schema) {
    return schema.optional().or(emptyStringToUndefined);
}
const EnvEnum = z.enum(['LOCAL', 'WORK', 'RC', 'PROD']);

export const env = createEnv({
    server: {
        FRONT_HOST: z.string().min(2),
        FRONT_PORT: z
            .string()
            .min(1)
            .transform(s => parseInt(s, 10))
            .pipe(z.number()),
        BACK_INTERNAL_URL: asOptionalField(z.string().url()),
        HTTP_AUTH_LOGIN: asOptionalField(z.string().min(4)),
        HTTP_AUTH_PASS: asOptionalField(z.string().min(4)),
        NEXT_PUBLIC_MOCKS_ENABLED: asOptionalField(
            z
                .string()
                .min(4)
                .transform(s => s === 'true' && s !== '0')
        ),
        NEXT_PUBLIC_APP_ENV: EnvEnum,
        NEXT_PUBLIC_FRONT_URL: z.string().url(),
        NEXT_PUBLIC_BACK_URL: z.string().url(),
        NEXT_PUBLIC_SENTRY_DSN: asOptionalField(z.string().url()),
        CACHE_PUBLIC_MAX_AGE: asOptionalField(z.number()),
        SENTRY_DSN: asOptionalField(z.string()),
        APP_ENV: asOptionalField(z.string()),
        BACK_PUBLIC_URL: asOptionalField(z.string().url()),
        NODE_ENV: asOptionalField(z.string()),
        ANALYZE: asOptionalField(z.string()),
    },
    client: {
        HTTP_AUTH_LOGIN: asOptionalField(z.string().min(4)),
        HTTP_AUTH_PASS: asOptionalField(z.string().min(4)),
        NEXT_PUBLIC_MOCKS_ENABLED: asOptionalField(
            z
                .string()
                .min(4)
                .transform(s => s === 'true' && s !== '0')
        ),
        NEXT_PUBLIC_APP_ENV: EnvEnum,
        NEXT_PUBLIC_FRONT_URL: z.string().url(),
        NEXT_PUBLIC_BACK_URL: z.string().url(),
        NEXT_PUBLIC_SENTRY_DSN: asOptionalField(z.string().url()),
        APP_ENV: asOptionalField(z.string().min(2)),
        BACK_PUBLIC_URL: asOptionalField(z.string().url()),
        NODE_ENV: asOptionalField(z.string()),
        NEXT_PUBLIC_FRONT_PROXY: z.string().min(2),
    },
    experimental__runtimeEnv: {
        HTTP_AUTH_LOGIN: process.env.HTTP_AUTH_LOGIN,
        HTTP_AUTH_PASS: process.env.HTTP_AUTH_PASS,
        NEXT_PUBLIC_MOCKS_ENABLED: process.env.NEXT_PUBLIC_MOCKS_ENABLED,
        NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
        NEXT_PUBLIC_FRONT_URL: process.env.NEXT_PUBLIC_FRONT_URL,
        NEXT_PUBLIC_BACK_URL: process.env.NEXT_PUBLIC_BACK_URL,
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
        APP_ENV: process.env.APP_ENV,
        BACK_PUBLIC_URL: process.env.BACK_PUBLIC_URL,
        NODE_ENV: process.env.NODE_ENV,
        NEXT_PUBLIC_FRONT_PROXY: process.env.NEXT_PUBLIC_FRONT_PROXY,
    },
});
