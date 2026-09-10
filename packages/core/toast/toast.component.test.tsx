import { beforeEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { createToastManager, Toaster } from '.'

class ResizeObserverStub {
    disconnect() {}
    observe() {}
    unobserve() {}
}

beforeEach(() => {
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
})

it('показывает несколько toast, выполняет действие, обновляет содержимое и закрывает выбранный toast', async () => {
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

    await screen.getByRole('button', { name: 'Undo' }).click()
    expect(action).toHaveBeenCalledTimes(1)

    manager.update(toastId, { description: 'The updated description' })

    await expect.element(screen.getByText('The updated description')).toBeVisible()
    await expect.element(screen.getByText('The original description')).not.toBeInTheDocument()

    const closeButtons = screen.getByRole('button', { name: 'Close toast' }).all()
    const closeButton = closeButtons.find((button) =>
        button.element().parentElement?.textContent?.includes('Changes saved'),
    )

    if (!closeButton) {
        throw new Error('Кнопка закрытия toast Changes saved не найдена')
    }

    await closeButton.click()
    await expect.element(screen.getByText('Changes saved')).not.toBeInTheDocument()
    await expect.element(screen.getByText('Second notification')).toBeVisible()
})

it('переводит promise-toast из загрузки в успех или ошибку по результату Promise', async () => {
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
