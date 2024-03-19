export const headers = () => {
    if (process.env.NODE_ENV !== 'production') return [];

    const CachePublicMaxAge = process.env.CACHE_PUBLIC_MAX_AGE ?? 3600;

    return [
        {
            source: '/:all*(svg|jpg|png|jpeg|woff|woff2|webp|ico)',
            locale: false,
            headers: [
                {
                    key: 'Cache-Control',
                    value: `public, max-age=${CachePublicMaxAge}, stale-while-revalidate`,
                },
            ],
        },
        {
            source: '/:path*',
            headers: [
                {
                    key: 'X-DNS-Prefetch-Control',
                    value: 'on',
                },
                {
                    key: 'Strict-Transport-Security',
                    value: 'max-age=63072000; includeSubDomains; preload',
                },
                {
                    key: 'X-XSS-Protection',
                    value: '1; mode=block',
                },
                {
                    key: 'X-Frame-Options',
                    value: 'SAMEORIGIN',
                },
                {
                    key: 'X-Content-Type-Options',
                    value: 'nosniff',
                },
            ],
        },
    ];
};
