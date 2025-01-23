import type { MetadataRoute } from 'next';

import { environment } from '~/env/client';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            changeFrequency: 'yearly',
            lastModified: new Date(),
            priority: 1,
            url: environment.NEXT_PUBLIC_FRONT_URL,
        },
    ];
}
