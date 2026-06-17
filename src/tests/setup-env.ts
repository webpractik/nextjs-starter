import { beforeEach, vi } from 'vitest'

declare const __NEXTJS_STARTER_TEST_ENV__: Record<string, string | undefined>

if (typeof globalThis.process === 'undefined') {
    Object.defineProperty(globalThis, 'process', {
        configurable: true,
        value: { env: { ...__NEXTJS_STARTER_TEST_ENV__ } },
    })
} else {
    for (const [key, value] of Object.entries(__NEXTJS_STARTER_TEST_ENV__)) {
        globalThis.process.env[key] ??= value
    }
}

type FetchMock = (
    ...args: Parameters<typeof globalThis.fetch>
) => ReturnType<typeof globalThis.fetch>

function formatFetchInput(input: Parameters<FetchMock>[0]) {
    if (typeof input === 'string') return input
    if (input instanceof URL) return input.toString()

    return input.url
}

beforeEach(() => {
    vi.stubGlobal(
        'fetch',
        vi.fn<FetchMock>(async (input) => {
            throw new Error(
                `Unhandled fetch in Vitest test: ${formatFetchInput(input)}. Mock fetch or the API hook in this test.`,
            )
        }),
    )
})
