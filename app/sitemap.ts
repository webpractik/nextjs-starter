import type { MetadataRoute } from 'next';

import { environment } from '~/env/client';

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: environment.NEXT_PUBLIC_FRONT_URL,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 1,
        },
    ];
}
