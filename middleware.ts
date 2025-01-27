import { type NextRequest, NextResponse } from 'next/server';

import { environment as clientEnvironment } from '~/env/client';
import { environment as serverEnvironment } from '~/env/server';

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};

export function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers);

    const url = request.nextUrl.clone();

    requestHeaders.set('x-url', request.url);

    const { NEXT_PUBLIC_BFF_PATH } = clientEnvironment;

    if (request.url.startsWith(NEXT_PUBLIC_BFF_PATH)) {
        const newUrl = new URL(
            url.pathname.replace(NEXT_PUBLIC_BFF_PATH, '') + url.search,
            serverEnvironment.BACK_INTERNAL_URL
        );

        console.info('Request proxied to --->', newUrl);

        return NextResponse.rewrite(newUrl);
    }

    return NextResponse.next({
        headers: requestHeaders,
        request: {
            headers: requestHeaders,
        },
    });
}
