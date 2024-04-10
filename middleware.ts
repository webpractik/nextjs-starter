import { NextRequest, NextResponse } from 'next/server';

import { env as clientEnv } from '~/env/client';
import { env as serverEnv } from '~/env/server';

export function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers);

    const url = request.nextUrl.clone();

    if (process.env.NODE_ENV === 'production') {
        const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

        const cspHeader = `
            default-src 'self';
            script-src 'self' 'unsafe-inline' ${clientEnv.NEXT_PUBLIC_FRONT_URL};
            style-src 'self' 'unsafe-inline' ${clientEnv.NEXT_PUBLIC_FRONT_URL};
            img-src 'self' blob: data:;
            child-src ${clientEnv.NEXT_PUBLIC_FRONT_URL};
            font-src 'self';
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'none';
            block-all-mixed-content;
            upgrade-insecure-requests;
        `;

        requestHeaders.set('x-nonce', nonce);

        requestHeaders.set('Content-Security-Policy', cspHeader.replaceAll(/\s{2,}/g, ' ').trim());
    }

    if (
        request.url.startsWith(
            `${clientEnv.NEXT_PUBLIC_FRONT_URL}${clientEnv.NEXT_PUBLIC_BFF_PATH}`
        )
    ) {
        return NextResponse.rewrite(
            `${serverEnv.BACK_INTERNAL_URL}${url.pathname.replace(clientEnv.NEXT_PUBLIC_BFF_PATH, '')}${
                url.search
            }`
        );
    }

    return NextResponse.next({
        headers: requestHeaders,
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        {
            source: '/((?!api/health|_next/static|_next/image|favicon.ico).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
};
