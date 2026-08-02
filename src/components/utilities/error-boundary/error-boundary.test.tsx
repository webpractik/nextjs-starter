import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ErrorBoundary } from './error-boundary'

describe('граница ошибок', () => {
    const errorMessage = 'Example error message'

    function BrokenContent(): never {
        throw new Error(errorMessage)
    }

    function RecoverableContent({
        onError,
        onReset,
    }: {
        onError: () => void
        onReset: () => void
    }) {
        const [isBroken, setIsBroken] = useState(true)

        return (
            <ErrorBoundary
                onError={onError}
                onReset={() => {
                    setIsBroken(false)
                    onReset()
                }}
            >
                {isBroken ? <BrokenContent /> : <p>Содержимое восстановлено</p>}
            </ErrorBoundary>
        )
    }

    it('перехватывает ошибку дочернего компонента и показывает штатный резервный интерфейс', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        const onError = vi.fn()
        const view = await render(
            <ErrorBoundary onError={onError}>
                <BrokenContent />
            </ErrorBoundary>,
        )

        await expect.element(view.getByTestId('error-boundary')).toBeVisible()
        await expect
            .element(view.getByRole('heading', { name: 'Техническая ошибка' }))
            .toBeVisible()
        await expect.element(view.getByText(errorMessage)).toBeVisible()
        await expect.element(view.getByRole('button', { name: 'Попробовать еще' })).toBeVisible()
        expect(onError).toHaveBeenCalledOnce()
    })

    it('после повторной попытки сбрасывает ошибку и снова показывает дочернее содержимое', async () => {
        vi.spyOn(console, 'error').mockImplementation(() => undefined)
        const onError = vi.fn()
        const onReset = vi.fn()
        const view = await render(<RecoverableContent onError={onError} onReset={onReset} />)

        await expect.element(view.getByText(errorMessage)).toBeVisible()
        await view.getByRole('button', { name: 'Попробовать еще' }).click()

        await expect.element(view.getByText('Содержимое восстановлено')).toBeVisible()
        expect(onError).toHaveBeenCalledOnce()
        expect(onReset).toHaveBeenCalledOnce()
    })
})
