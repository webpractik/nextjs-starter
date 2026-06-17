import { isDev } from '#/constants/env'
import {
    getBrowserMockScenario,
    getRequestMockScenario,
    isBrowserRuntimeMockModeEnabled,
    isRequestMockModeEnabled,
} from '#/mock-mode/runtime'

import { clientEnvironment } from '../../src/env/client'
import { serverEnvironment } from '../../src/env/server'
import { serializeSearchParams } from './search-params'

/** Subset of FetchRequestConfig */
export interface RequestConfig<TData = unknown> {
    baseURL?: string
    url?: string
    method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE' | 'OPTIONS' | 'HEAD'
    // Object shape keeps generated OpenAPI query params assignable without casts.
    // Runtime serialization lives in `search-params.ts`.
    params?: object
    data?: TData | FormData
    signal?: AbortSignal
    headers?: [string, string][] | Record<string, string>
    credentials?: RequestCredentials
}

/** Subset of FetchResponse */
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

function isEnvFlagEnabled(value: boolean | string | undefined) {
    return value === true || value === 'true'
}

async function isMockModeEnabled(config: Partial<RequestConfig>) {
    if (typeof window === 'undefined') {
        if (
            isEnvFlagEnabled(process.env.MOCK_MODE) ||
            isEnvFlagEnabled(serverEnvironment.MOCK_MODE) ||
            isRequestMockModeEnabled(config.headers)
        ) {
            return true
        }

        if (process.env.NEXT_RUNTIME !== 'nodejs' && process.env.NEXT_RUNTIME !== 'edge') {
            return false
        }

        try {
            const { headers } = await import('next/headers')
            return isRequestMockModeEnabled(await headers())
        } catch {
            return false
        }
    }

    return (
        isEnvFlagEnabled(process.env.NEXT_PUBLIC_MOCK_MODE ?? process.env.MOCK_MODE) ||
        isEnvFlagEnabled(clientEnvironment.NEXT_PUBLIC_MOCK_MODE) ||
        isRequestMockModeEnabled(config.headers) ||
        isBrowserRuntimeMockModeEnabled()
    )
}

async function getRawMockScenario(config: Partial<RequestConfig>) {
    const rawFromConfig = getRequestMockScenario(config.headers)
    if (rawFromConfig != null) {
        return rawFromConfig
    }

    if (typeof window === 'undefined') {
        if (process.env.NEXT_RUNTIME !== 'nodejs' && process.env.NEXT_RUNTIME !== 'edge') {
            return
        }

        try {
            const { headers } = await import('next/headers')
            return getRequestMockScenario(await headers())
        } catch {
            return
        }
    }

    return getBrowserMockScenario()
}

async function getMockScenario(config: Partial<RequestConfig>) {
    const raw = await getRawMockScenario(config)
    if (raw == null) return

    const { isBaseMockScenarioName } = await import('./mock-scenarios')
    if (!isBaseMockScenarioName(raw)) return
    return raw
}

async function fetch<TData, _TError = unknown, TVariables = unknown>(
    paramsConfig: RequestConfig<TVariables>,
): Promise<ResponseConfig<TData>> {
    const config = mergeConfig(getConfig(), paramsConfig)

    const isMockMode = await isMockModeEnabled(config)
    if (isMockMode) {
        const { getMockResponse } = await import('./mock-client')
        const scenario = await getMockScenario(config)
        return getMockResponse<TData>(config, scenario)
    }

    const baseURL = getBaseUrl()
    let targetUrl = [baseURL, config.url].filter(Boolean).join('')

    if (config.params) {
        const serializedSearchParams = serializeSearchParams(config.params)
        if (serializedSearchParams !== '') {
            targetUrl += `?${serializedSearchParams}`
        }
    }

    const isFormData = config.data instanceof FormData
    const headers: Record<string, string> = {
        ...(Array.isArray(config.headers) ? Object.fromEntries(config.headers) : config.headers),
        ...(!isFormData && { 'Content-Type': 'application/json' }),
    }

    const response = await globalThis.fetch(targetUrl, {
        credentials: config.credentials ?? 'include',
        method: config.method?.toUpperCase(),
        body: isFormData ? (config.data as FormData) : JSON.stringify(config.data),
        signal: config.signal,
        headers,
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(response.statusText, {
            cause: { data: errorData, status: response.status, statusText: response.statusText },
        })
    }

    const data =
        [204, 205, 304].includes(response.status) || !response.body ? {} : await response.json()

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
