import { NextRequest, NextResponse } from 'next/server';

import { environment as clientEnvironment } from '~/env/client';
import { environment as serverEnvironment } from '~/env/server';

function setCSPHeaders(headers: Headers) {
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    const cspHeader = `
            default-src 'self';
            script-src 'self' 'unsafe-eval' 'unsafe-inline';
            style-src 'self' 'unsafe-inline';
            img-src 'self' blob: data:;
            font-src 'self';
            object-src 'none';
            base-uri 'self';
            form-action 'self';
            frame-ancestors 'none';
            upgrade-insecure-requests;
        `;

    headers.set('x-nonce', nonce);

    headers.set('Content-Security-Policy', cspHeader.replaceAll(/\s{2,}/g, ' ').trim());
}

export function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers);

    const url = request.nextUrl.clone();

    if (process.env.NODE_ENV === 'production') {
        setCSPHeaders(requestHeaders);
    }

    requestHeaders.set('x-url', request.url);

    if (
        request.url.startsWith(
            `${clientEnvironment.NEXT_PUBLIC_FRONT_URL}${clientEnvironment.NEXT_PUBLIC_BFF_PATH}`
        )
    ) {
        return NextResponse.rewrite(
            `${serverEnvironment.BACK_INTERNAL_URL}${url.pathname.replace(clientEnvironment.NEXT_PUBLIC_BFF_PATH, '')}${
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
            source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
};
