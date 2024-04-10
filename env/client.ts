import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
    client: {
        NEXT_PUBLIC_APP_ENV: z.enum(['LOCAL', 'WORK', 'RC', 'PROD']),
        NEXT_PUBLIC_FRONT_URL: z.string().url(),
        NEXT_PUBLIC_BFF_PATH: z.string(),
        NEXT_PUBLIC_SENTRY_DSN: z.string().url(),
    },
    runtimeEnv: {
        NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
        NEXT_PUBLIC_FRONT_URL: process.env.NEXT_PUBLIC_FRONT_URL,
        NEXT_PUBLIC_BFF_PATH: process.env.NEXT_PUBLIC_BFF_PATH,
        NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    },
    emptyStringAsUndefined: true,
});
