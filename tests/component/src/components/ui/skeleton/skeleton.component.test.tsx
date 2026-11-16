import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Skeleton } from '#/components/ui/skeleton'

it('позволяет скрыть декоративный placeholder от вспомогательных технологий', async () => {
    const screen = await render(
        <Skeleton aria-hidden="true" data-testid="placeholder" className="h-8 w-24" />,
    )
    const skeleton = screen.getByTestId('placeholder')
    await expect.element(skeleton).toHaveAttribute('aria-hidden', 'true')
    await expect.element(skeleton).toHaveClass('h-8')
    await expect.element(skeleton).toHaveClass('w-24')
})
