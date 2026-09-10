import { vi } from 'vitest'

type MockFunction<Args extends unknown[] = unknown[], Result = unknown> = ((
    ..._args: Args
) => Result) & {
    mockReset: () => void
}

function createMockFunction<Args extends unknown[] = unknown[], Result = unknown>() {
    return vi.fn<(..._args: Args) => Result>() as MockFunction<Args, Result>
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

interface NextNavigationMock {
    params: Record<string, string | string[]>
    pathname: string
    searchParams: URLSearchParams
}

export const nextNavigationMock: NextNavigationMock = {
    params: {},
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
