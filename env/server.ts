import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
    server: {
        APP_ENV: z.enum(['LOCAL', 'WORK', 'RC', 'PROD']),
        FRONT_HOST: z.string(),
        FRONT_PORT: z
            .string()
            .transform(port => Number(port))
            .pipe(z.number()),
        BACK_INTERNAL_URL: z.string().url(),
        HTTP_AUTH_LOGIN: z.string().optional(),
        HTTP_AUTH_PASS: z.string().optional(),
        CACHE_PUBLIC_MAX_AGE: z
            .string()
            .transform(maxAge => Number(maxAge))
            .pipe(z.number())
            .optional(),
    },
    runtimeEnv: {
        APP_ENV: process.env.APP_ENV,
        FRONT_HOST: process.env.FRONT_HOST,
        FRONT_PORT: process.env.FRONT_PORT,
        BACK_INTERNAL_URL: process.env.BACK_INTERNAL_URL,
        HTTP_AUTH_LOGIN: process.env.HTTP_AUTH_LOGIN,
        HTTP_AUTH_PASS: process.env.HTTP_AUTH_PASS,
        CACHE_PUBLIC_MAX_AGE: process.env.CACHE_PUBLIC_MAX_AGE,
    },
    emptyStringAsUndefined: true,
});
