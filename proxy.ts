import { chainProxy } from '#/proxy/chain'
import { injectHeaders } from '#/proxy/inject-headers'
import { requestLogging } from '#/proxy/request-logging'

export const proxy = chainProxy([
	requestLogging,
	injectHeaders,
])

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
}
