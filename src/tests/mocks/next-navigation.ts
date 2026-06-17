import { vi } from 'vitest'

/* eslint-disable react/no-unnecessary-use-prefix -- Next.js navigation exports are hook-compatible mocks. */

type MockFunction<Args extends unknown[] = unknown[], Result = unknown> = ((
    ...args: Args
) => Result) & {
    mockReset: () => void
}

function createMockFunction<Args extends unknown[] = unknown[], Result = unknown>() {
    return vi.fn<(...args: Args) => Result>() as MockFunction<Args, Result>
}

interface NextRouterMock {
    back: MockFunction
    forward: MockFunction
    prefetch: MockFunction
    push: MockFunction
    refresh: MockFunction
    replace: MockFunction
}

export const nextRouterMock: NextRouterMock = {
    back: createMockFunction(),
    forward: createMockFunction(),
    prefetch: createMockFunction(),
    push: createMockFunction(),
    refresh: createMockFunction(),
    replace: createMockFunction(),
}

export const nextNavigationMock = {
    params: {} as Record<string, string | string[]>,
    pathname: '/',
    searchParams: new URLSearchParams(),
}

export const redirect: MockFunction = createMockFunction()
export const permanentRedirect: MockFunction = createMockFunction()
export const notFound: MockFunction = createMockFunction()

export const RedirectType = {
    push: 'push',
    replace: 'replace',
} as const

export function useRouter(): NextRouterMock {
    return nextRouterMock
}

export function usePathname() {
    return nextNavigationMock.pathname
}

export function useSearchParams() {
    return nextNavigationMock.searchParams
}

export function useParams() {
    return nextNavigationMock.params
}

export function resetNextNavigationMock() {
    nextRouterMock.back.mockReset()
    nextRouterMock.forward.mockReset()
    nextRouterMock.prefetch.mockReset()
    nextRouterMock.push.mockReset()
    nextRouterMock.refresh.mockReset()
    nextRouterMock.replace.mockReset()
    redirect.mockReset()
    permanentRedirect.mockReset()
    notFound.mockReset()
    nextNavigationMock.params = {}
    nextNavigationMock.pathname = '/'
    nextNavigationMock.searchParams = new URLSearchParams()
}
