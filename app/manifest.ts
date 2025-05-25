import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
    return {
        background_color: '#fff',
        description: 'Next.js App',
        display: 'standalone',
        icons: [
            {
                sizes: 'any',
                src: '/favicon.ico',
                type: 'image/x-icon',
            },
        ],
        name: 'Next.js App',
        short_name: 'Next.js App',
        start_url: '/',
        theme_color: '#fff',
    };
}
