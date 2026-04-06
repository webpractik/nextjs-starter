import type { NextRequest, NextResponse } from 'next/server'
import type { ProxyFn } from './chain'

import logger from '@repo/logger'

export const requestLogging: ProxyFn = (request: NextRequest, response: NextResponse) => {
	const start = Date.now()
	const { method } = request
	const { pathname } = request.nextUrl

	const duration = Date.now() - start

	logger.info(`${method} ${pathname} ${duration}ms`)

	return response
}
