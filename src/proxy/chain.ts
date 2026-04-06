import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export type ProxyFn = (
	request: NextRequest,
	response: NextResponse,
) => NextResponse | Response | Promise<NextResponse | Response>

export function chainProxy(proxies: ProxyFn[]) {
	return async (request: NextRequest) => {
		let response = NextResponse.next()

		for (const proxy of proxies) {
			const result = await proxy(request, response)

			if (result instanceof NextResponse) {
				response = result
			}
			else {
				return result
			}
		}

		return response
	}
}
