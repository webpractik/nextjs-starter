import { beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { createToastManager, Toaster } from '.'

class ResizeObserverStub {
    disconnect() {}
    observe() {}
    unobserve() {}
}

beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
})

it('renders, updates, acts on, stacks, and closes managed toasts', async () => {
    const action = vi.fn()
    const manager = createToastManager()
    const screen = await render(<Toaster toastManager={manager} timeout={0} />)
    const toastId = manager.add({
        actionProps: {
            children: 'Undo',
            onClick: action,
        },
        description: 'The original description',
        title: 'Changes saved',
        type: 'success',
    })

    manager.add({ title: 'Second notification' })

    await expect.element(screen.getByText('Changes saved')).toBeVisible()
    await expect.element(screen.getByText('The original description')).toBeVisible()
    await expect.element(screen.getByText('Second notification')).toBeVisible()

    const toastRoot = screen.getByText('Changes saved').element().closest('[data-slot="toast"]')

    expect(toastRoot?.querySelector('[data-slot="toast-icon"]')).not.toBeNull()

    await screen.getByRole('button', { name: 'Undo' }).click()
    expect(action).toHaveBeenCalledOnce()

    manager.update(toastId, { description: 'The updated description' })

    await expect.element(screen.getByText('The updated description')).toBeVisible()
    await expect.element(screen.getByText('The original description')).not.toBeInTheDocument()

    const closeButton = toastRoot?.querySelector<HTMLElement>('[data-slot="toast-close"]')

    if (!closeButton) {
        throw new Error('Expected the first toast to have a close button')
    }

    await userEvent.click(closeButton)
    await expect.element(screen.getByText('Changes saved')).not.toBeInTheDocument()
    await expect.element(screen.getByText('Second notification')).toBeVisible()
})

it('transitions promise notifications through loading, success, and error states', async () => {
    const manager = createToastManager()
    const screen = await render(<Toaster toastManager={manager} timeout={0} />)

    let resolveUpload: (_value: string) => void = () => undefined
    const upload = new Promise<string>((resolve) => {
        resolveUpload = resolve
    })
    const trackedUpload = manager.promise(upload, {
        error: 'Upload failed',
        loading: 'Uploading report',
        success: (filename) => `Uploaded ${filename}`,
    })

    await expect.element(screen.getByText('Uploading report')).toBeVisible()
    resolveUpload('report.pdf')
    await trackedUpload
    await expect.element(screen.getByText('Uploaded report.pdf')).toBeVisible()

    let rejectUpload: (_reason: Error) => void = () => undefined
    const failedUpload = new Promise<never>((_resolve, reject) => {
        rejectUpload = reject
    })
    const trackedFailure = manager.promise(failedUpload, {
        error: (error) => `Upload failed: ${String(error)}`,
        loading: 'Uploading archive',
        success: 'Archive uploaded',
    })

    await expect.element(screen.getByText('Uploading archive')).toBeVisible()
    rejectUpload(new Error('Network unavailable'))
    await expect(trackedFailure).rejects.toThrow('Network unavailable')
    await expect
        .element(screen.getByText('Upload failed: Error: Network unavailable'))
        .toBeVisible()
})
