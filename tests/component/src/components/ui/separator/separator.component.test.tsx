import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Separator } from '#/components/ui/separator'

it('отражает ориентацию в доступной семантике разделителя', async () => {
    const screen = await render(<Separator orientation="vertical" />)
    await expect
        .element(screen.getByRole('separator'))
        .toHaveAttribute('aria-orientation', 'vertical')
    await screen.rerender(<Separator />)
    await expect
        .element(screen.getByRole('separator'))
        .not.toHaveAttribute('aria-orientation', 'vertical')
})
