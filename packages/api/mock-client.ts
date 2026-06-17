import type { RequestConfig, ResponseConfig } from './fetch.client'
import type { BaseMockScenarioName } from './mock-scenarios'

import { mockRoutes } from './codegen/mock-client-routes'
import { getMockScenarioRoute } from './mock-scenarios'

export type RequestMethod = NonNullable<RequestConfig['method']>

export interface MockRoute {
    method: RequestMethod
    pattern: RegExp
    status?: number
    create: () => unknown
}

const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    202: 'Accepted',
    204: 'No Content',
    302: 'Found',
}
const trailingSlashesPattern = /\/+$/

function normalizeMethod(method: RequestConfig['method']): RequestMethod {
    return method ?? 'GET'
}

function normalizePath(url: RequestConfig['url']) {
    const path = (url ?? '').split('?')[0]?.replace(trailingSlashesPattern, '')

    return path == null || path === '' ? '/' : path
}

export async function getMockResponse<TData>(
    config: Partial<RequestConfig>,
    scenario?: BaseMockScenarioName,
): Promise<ResponseConfig<TData>> {
    const method = normalizeMethod(config.method)
    const path = normalizePath(config.url)
    const route =
        getMockScenarioRoute(method, path, scenario) ??
        mockRoutes.find((item) => item.method === method && item.pattern.test(path))

    if (!route) {
        throw new Error(`Mock response is not configured for ${method} ${path}`)
    }

    const status = route.status ?? 200

    return {
        data: route.create() as TData,
        status,
        statusText: statusTexts[status] ?? 'OK',
        headers: new Headers({
            'content-type': 'application/json',
            'x-mock-mode': 'true',
        }),
    }
}
