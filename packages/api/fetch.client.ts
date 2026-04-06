import { isDev } from '#/constants/env'
import { clientEnvironment } from '../../src/env/client'
import { serverEnvironment } from '../../src/env/server'

/**
 * Subset of FetchRequestConfig
 */
export interface RequestConfig<TData = unknown> {
	baseURL?: string
	url?: string
	method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
	params?: Record<string, string | number | boolean | null | undefined>
	data?: TData | FormData
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

function getBaseUrl() {
	if (typeof window === 'undefined') {
		return serverEnvironment.BACK_INTERNAL_URL
	}

	if (isDev) {
		return clientEnvironment.NEXT_PUBLIC_BFF_PATH
	}

	return clientEnvironment.NEXT_PUBLIC_BACK_URL
}

async function fetch<TData, _TError = unknown, TVariables = unknown>(paramsConfig: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> {
	const config = mergeConfig(getConfig(), paramsConfig)

	const baseURL = getBaseUrl()
	let targetUrl = [baseURL, config.url].filter(Boolean).join('')

	if (config.params) {
		const searchParams = new URLSearchParams()

		for (const [key, value] of Object.entries(config.params)) {
			if (value !== undefined) {
				searchParams.append(key, value === null ? 'null' : String(value))
			}
		}

		targetUrl += `?${searchParams}`
	}

	const isFormData = config.data instanceof FormData
	const headers: Record<string, string> = {
		...(Array.isArray(config.headers) ? Object.fromEntries(config.headers) : config.headers),
		...(!isFormData && { 'Content-Type': 'application/json' }),
	}

	const response = await globalThis.fetch(targetUrl, {
		credentials: config.credentials ?? 'include',
		method: config.method?.toUpperCase(),
		body: isFormData ? config.data as FormData : JSON.stringify(config.data),
		signal: config.signal,
		headers,
	})

	if (!response.ok) {
		const errorData = await response.json()
		throw new Error(response.statusText, { cause: { data: errorData, status: response.status, statusText: response.statusText } })
	}

	const data
		= [204, 205, 304].includes(response.status) || !response.body ? {} : await response.json()

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
