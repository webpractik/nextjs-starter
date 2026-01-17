import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}

export function proxy(request: NextRequest) {
	const requestHeaders = new Headers(request.headers)

	requestHeaders.set('x-url', request.url)

	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	})
}
