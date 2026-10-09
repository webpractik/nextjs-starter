import type { ZodError } from 'zod'

import { createClientConfig } from './client-config'

interface Validator {
    parse: (value: unknown) => unknown
}

interface ParameterStyle {
    explode?: boolean
    style?: string
}

export interface Config extends Omit<RequestInit, 'body' | 'headers' | 'method'> {
    baseUrl?: string
    fetch?: typeof globalThis.fetch
    headers?: HeadersInit
}

export interface RequestOptions extends Config {
    body?: unknown
    method: string
    path?: Record<string, unknown>
    query?: Record<string, unknown>
    styles?: { query?: Record<string, ParameterStyle> }
    throwOnError?: boolean
    url: string
    validator?: { error?: Validator; response?: Validator }
}

export type Options<
    TData extends Record<string, unknown> = Record<string, unknown>,
    ThrowOnError extends boolean = false,
> = Omit<
    RequestOptions,
    'body' | 'headers' | 'method' | 'path' | 'query' | 'throwOnError' | 'url'
> &
    Omit<TData, 'headers'> & {
        client?: Client
        headers?: HeadersInit
        throwOnError?: ThrowOnError
    }

type SuccessStatus<T> = Extract<keyof T, `2${string}`>
type ResponseData<T> =
    | ('204' extends keyof T ? undefined : never)
    | T[Exclude<SuccessStatus<T>, '204'>]
type ResponseError<T> = Error | T[Exclude<keyof T, SuccessStatus<T>>] | ZodError

export type RequestResult<
    TResponses extends Record<string, unknown>,
    ThrowOnError extends boolean = false,
> =
    | (ThrowOnError extends true
          ? never
          : { data: undefined; error: ResponseError<TResponses>; response: Response | undefined })
    | { data: ResponseData<TResponses>; error: undefined; response: Response }

interface ClientResult {
    data: unknown
    error: unknown
    response: Response | undefined
}

type MethodOptions = Omit<RequestOptions, 'method'>

export interface Client {
    (options: RequestOptions): Promise<ClientResult>
    delete: (options: MethodOptions) => Promise<ClientResult>
    get: (options: MethodOptions) => Promise<ClientResult>
    getConfig: () => Config
    patch: (options: MethodOptions) => Promise<ClientResult>
    post: (options: MethodOptions) => Promise<ClientResult>
    put: (options: MethodOptions) => Promise<ClientResult>
    setConfig: (config: Config) => Config
}

export type ClientOptions = Config

function parameterText(value: unknown): string {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value)
    }
    throw new Error('API parameters must be strings, numbers or booleans')
}

function queryValues(value: unknown, style?: ParameterStyle): unknown[] {
    if (style?.style !== undefined && style.style !== 'form') {
        throw new Error(`Unsupported API query style: ${style.style}`)
    }

    if (!Array.isArray(value)) {
        return [value]
    }
    return style?.explode === false ? [value.join(',')] : value
}

function requestUrl(
    baseUrl: string,
    pathname: string,
    path?: Record<string, unknown>,
    query?: Record<string, unknown>,
    styles?: RequestOptions['styles'],
) {
    const parameters = new Map(Object.entries(path ?? {}))
    const resolvedPath = pathname.replaceAll(/\{([^}]+)\}/g, (_match, name: string) => {
        const value = parameters.get(name)

        if (value === undefined || value === null) {
            throw new Error(`Missing API path parameter: ${name}`)
        }
        return encodeURIComponent(parameterText(value))
    })
    const search = new URLSearchParams()

    for (const [name, value] of Object.entries(query ?? {})) {
        if (value !== undefined && value !== null) {
            const values = queryValues(value, styles?.query?.[name])

            for (const item of values) {
                search.append(name, parameterText(item))
            }
        }
    }

    const url = `${baseUrl.replace(/\/$/, '')}/${resolvedPath.replace(/^\//, '')}`
    return search.size === 0 ? url : `${url}?${search}`
}

function requestHeaders(defaultHeaders: HeadersInit | undefined, headers: HeadersInit | undefined) {
    const result = new Headers(defaultHeaders)

    for (const [name, value] of new Headers(headers)) {
        result.set(name, value)
    }
    return result
}

export function createClient(override: Config = {}): Client {
    let defaults: Config = { ...createClientConfig(override), ...override }

    const request = async (options: RequestOptions): Promise<ClientResult> => {
        const {
            baseUrl = '',
            body,
            fetch = globalThis.fetch,
            headers,
            path,
            query,
            styles,
            throwOnError = false,
            url,
            validator,
            ...init
        } = { ...defaults, ...options }
        let response: Response | undefined

        try {
            const mergedHeaders = requestHeaders(defaults.headers, headers)

            if (body !== undefined && !mergedHeaders.has('content-type')) {
                mergedHeaders.set('content-type', 'application/json')
            }

            response = await fetch(requestUrl(baseUrl, url, path, query, styles), {
                ...init,
                body: body === undefined ? undefined : JSON.stringify(body),
                headers: mergedHeaders,
            })
            const payload: unknown = response.status === 204 ? undefined : await response.json()

            if (!response.ok) {
                if (throwOnError) {
                    throw payload
                }
                return { data: undefined, error: payload, response }
            }

            const data =
                response.status === 204
                    ? undefined
                    : (validator?.response?.parse(payload) ?? payload)
            return { data, error: undefined, response }
        } catch (error) {
            if (throwOnError) {
                throw error
            }
            return { data: undefined, error, response }
        }
    }

    return Object.assign(request, {
        getConfig: () => ({ ...defaults }),
        setConfig: (config: Config) => {
            defaults = { ...defaults, ...config }
            return { ...defaults }
        },
        get: async (options: MethodOptions) => request({ ...options, method: 'GET' }),
        post: async (options: MethodOptions) => request({ ...options, method: 'POST' }),
        put: async (options: MethodOptions) => request({ ...options, method: 'PUT' }),
        patch: async (options: MethodOptions) => request({ ...options, method: 'PATCH' }),
        delete: async (options: MethodOptions) => request({ ...options, method: 'DELETE' }),
    })
}

export const client = createClient()
