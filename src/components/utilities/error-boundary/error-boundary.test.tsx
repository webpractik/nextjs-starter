import { noop } from 'lodash-es'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { ErrorFallback } from './error-boundary'

describe('<ErrorBoundary />', () => {
    const errorMessage = 'Example error message'
    const error = new Error(errorMessage)

    it('it renders correctly', async () => {
        const view = await render(<ErrorFallback error={error} resetError={noop} />)

        await expect.element(view.getByTestId('error-boundary')).toBeVisible()
    })

    it('it renders error message', async () => {
        const view = await render(<ErrorFallback error={error} resetError={noop} />)

        await expect.element(view.getByText(errorMessage)).toBeVisible()
    })

    it('it handles reset error', async () => {
        const mockFunction = vi.fn()

        const view = await render(<ErrorFallback error={error} resetError={mockFunction} />)

        await view.getByText('Попробовать еще').click()

        expect(mockFunction).toHaveBeenCalled()
    })
})
