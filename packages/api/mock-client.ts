import type { BaseMockScenarioName } from './mock-scenarios'

import { en, Faker } from '@faker-js/faker'

import { mockRoutes } from './codegen/mock-client-routes'
import { getMockScenarioRoute } from './mock-scenarios'

export type RequestMethod = 'DELETE' | 'GET' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'POST' | 'PUT'

export interface MockRequestConfig {
    headers?: HeadersInit
    method?: string
    url?: string
}

export interface MockFactoryOptions {
    faker: Faker
}

export interface MockRoute {
    method: RequestMethod
    operationId?: string
    pattern: RegExp
    status?: number
    tag?: string
    create?: (_options: MockFactoryOptions) => unknown
}

const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    302: 'Found',
}
const trailingSlashesPattern = /\/+$/

function normalizeMethod(method: MockRequestConfig['method']): RequestMethod {
    return (method?.toUpperCase() ?? 'GET') as RequestMethod
}

function normalizePath(url: MockRequestConfig['url']) {
    let pathname: string

    try {
        pathname = new URL(url ?? '/', 'http://localhost').pathname
    } catch {
        pathname = url?.split('?')[0] ?? '/'
    }

    const path = pathname.replace(trailingSlashesPattern, '')

    return path === '' ? '/' : path
}

function createRequestFaker() {
    const faker = new Faker({ locale: [en] })
    faker.seed(100)
    return faker
}

export async function getMockResponse(config: MockRequestConfig, scenario?: BaseMockScenarioName) {
    const method = normalizeMethod(config.method)
    const path = normalizePath(config.url)
    const route =
        getMockScenarioRoute(method, path, scenario) ??
        mockRoutes.find((item) => item.method === method && item.pattern.test(path))

    if (!route) {
        throw new Error(`Mock response is not configured for ${method} ${path}`)
    }

    const status = route.status ?? 200
    const hasBody = status !== 204 && route.create !== undefined
    const headers = new Headers({ 'x-mock-mode': 'true' })

    if (hasBody) {
        headers.set('content-type', 'application/json')
    }

    return new Response(
        hasBody ? JSON.stringify(route.create?.({ faker: createRequestFaker() })) : null,
        {
            headers,
            status,
            statusText: statusTexts[status] ?? 'OK',
        },
    )
}
