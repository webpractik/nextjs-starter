import type { MetadataRoute } from 'next';

import { environment } from '#/env/client';

export default function robots(): MetadataRoute.Robots {
    const notIndexed = ['RC', 'WORK'].includes(environment.NEXT_PUBLIC_APP_ENV);

    if (notIndexed) {
        return {
            rules: {
                disallow: '/',
                userAgent: '*',
            },
        };
    }

    return {
        rules: {
            allow: '/',
            userAgent: '*',
        },
    };
}
