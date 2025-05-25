import { type NextRequest, NextResponse } from 'next/server';

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};

export function middleware(request: NextRequest) {
    const requestHeaders = new Headers(request.headers);

    requestHeaders.set('x-url', request.url);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}
