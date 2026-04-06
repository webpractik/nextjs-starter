export const isDev = process.env.NODE_ENV === 'development'
export const isProd = process.env.NODE_ENV === 'production'

export function isBrowser() {
	return Boolean(typeof window !== 'undefined')
}
