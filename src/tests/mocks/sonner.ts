import type { HTMLAttributes } from 'react'

import { createElement } from 'react'
import { vi } from 'vitest'

export type ToasterProps = HTMLAttributes<HTMLDivElement>

type MockFunction<Args extends unknown[] = unknown[], Result = unknown> = ((
    ...args: Args
) => Result) & {
    mockReset: () => void
}

function createMockFunction<Args extends unknown[] = unknown[], Result = unknown>() {
    return vi.fn<(...args: Args) => Result>() as MockFunction<Args, Result>
}

interface ToastMock {
    custom: MockFunction
    dismiss: MockFunction
    error: MockFunction
    info: MockFunction
    loading: MockFunction
    message: MockFunction
    promise: MockFunction
    success: MockFunction
    warning: MockFunction
}

export const toastMock: ToastMock = {
    custom: createMockFunction(),
    dismiss: createMockFunction(),
    error: createMockFunction(),
    info: createMockFunction(),
    loading: createMockFunction(),
    message: createMockFunction(),
    promise: createMockFunction(),
    success: createMockFunction(),
    warning: createMockFunction(),
}

export const toast: ToastMock = toastMock

export function Toaster(props: ToasterProps) {
    return createElement('div', {
        ...props,
        'data-testid': 'sonner-toaster',
    })
}

export function resetSonnerMock() {
    toastMock.custom.mockReset()
    toastMock.dismiss.mockReset()
    toastMock.error.mockReset()
    toastMock.info.mockReset()
    toastMock.loading.mockReset()
    toastMock.message.mockReset()
    toastMock.promise.mockReset()
    toastMock.success.mockReset()
    toastMock.warning.mockReset()
}
