import type { NextRequest } from 'next/server'
import type { ProxyFn } from './chain'

import { NextResponse } from 'next/server'

export const injectHeaders: ProxyFn = (request: NextRequest) => {
	const requestHeaders = new Headers(request.headers)

	requestHeaders.set('x-url', request.url)

	return NextResponse.next({
		request: {
			headers: requestHeaders,
		},
	})
}
