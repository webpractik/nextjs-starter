import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { FormDevtoolsProvider } from '.'

it('не добавляет инструменты разработки в DOM вне development-окружения', async () => {
    const screen = await render(
        <div data-testid="provider-root">
            <FormDevtoolsProvider />
        </div>,
    )

    await expect.element(screen.getByTestId('provider-root')).toBeEmptyDOMElement()
})
