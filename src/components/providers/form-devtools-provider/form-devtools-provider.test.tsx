import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { FormDevtoolsProvider } from '.'

it('renders no development tooling in the test environment', async () => {
    const screen = await render(
        <div data-testid="provider-root">
            <FormDevtoolsProvider />
        </div>,
    )

    await expect.element(screen.getByTestId('provider-root')).toBeEmptyDOMElement()
})
