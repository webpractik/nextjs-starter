import { clientEnvironment } from '../../src/env/client'
import { serverEnvironment } from '../../src/env/server'

/**
 * RequestCredentials
 */
export type RequestCredentials = 'omit' | 'same-origin' | 'include'

/**
 * Subset of FetchRequestConfig
 */
export interface RequestConfig<TData = unknown> {
	baseURL?: string
	url?: string
	method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
	params?: unknown
	data?: TData | FormData
	responseType?: 'arraybuffer' | 'blob' | 'document' | 'json' | 'text' | 'stream'
	signal?: AbortSignal
	headers?: [string, string][] | Record<string, string>
	credentials?: RequestCredentials
}

/**
 * Subset of FetchResponse
 */
export interface ResponseConfig<TData = unknown> {
	data: TData
	status: number
	statusText: string
	headers: Headers
}

let _config: Partial<RequestConfig> = {}

export const getConfig = () => _config

export function setConfig(config: Partial<RequestConfig>) {
	_config = config
	return getConfig()
}

export function mergeConfig<T extends RequestConfig>(...configs: Array<Partial<T>>): Partial<T> {
	return configs.reduce<Partial<T>>((merged, config) => {
		return {
			...merged,
			...config,
			headers: {
				...(Array.isArray(merged.headers)
					? Object.fromEntries(merged.headers)
					: merged.headers),
				...(Array.isArray(config.headers)
					? Object.fromEntries(config.headers)
					: config.headers),
			},
		}
	}, {})
}

export type ResponseErrorConfig<TError = unknown> = TError

export type Client = <TData, _TError = unknown, TVariables = unknown>(
	config: RequestConfig<TVariables>,
) => Promise<ResponseConfig<TData>>

async function fetch<TData, _TError = unknown, TVariables = unknown>(paramsConfig: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> {
	const normalizedParams = new URLSearchParams()

	const config = mergeConfig(getConfig(), paramsConfig)

	Object.entries(config.params || {}).forEach(([key, value]) => {
		if (value !== undefined) {
			normalizedParams.append(key, value === null ? 'null' : value.toString())
		}
	})

	const baseURL
		= typeof window === 'undefined'
			? serverEnvironment.BACK_INTERNAL_URL
			: clientEnvironment.NEXT_PUBLIC_BACK_URL

	let targetUrl = [baseURL, config.url].filter(Boolean).join('')

	if (config.params) {
		targetUrl += `?${normalizedParams}`
	}

	const response = await globalThis.fetch(targetUrl, {
		credentials: 'include',
		method: config.method?.toUpperCase(),
		body: config.data instanceof FormData ? config.data : JSON.stringify(config.data),
		signal: config.signal,
		headers: { ...config.headers, 'Content-Type': 'application/json' },
	})

	const data
		= [204, 205, 304].includes(response.status) || !response.body ? {} : await response.json()

	if (!response.ok) {
		throw new Error(response.statusText, { cause: { data, status: response.status, statusText: response.statusText } })
	}

	return {
		data: data as TData,
		status: response.status,
		statusText: response.statusText,
		headers: response.headers as Headers,
	}
}

fetch.getConfig = getConfig
fetch.setConfig = setConfig

export default fetch
