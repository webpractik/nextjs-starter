import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Badge } from '#/components/ui/badge'

it('сохраняет содержимое и семантику переданного элемента', async () => {
    const screen = await render(
        <Badge render={<a href="https://example.com/status" />} variant="secondary">
            Готово
        </Badge>,
    )
    const link = screen.getByRole('link', { name: 'Готово' })
    await expect.element(link).toHaveAttribute('href', 'https://example.com/status')
    await expect.element(link).toHaveAttribute('data-variant', 'secondary')
})
