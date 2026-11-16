import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Typography } from '#/components/ui/typography'

it('создаёт заголовок нужного уровня и сохраняет доступные атрибуты', async () => {
    const screen = await render(
        <Typography variant="h2" id="section-title">
            Настройки
        </Typography>,
    )
    await expect
        .element(screen.getByRole('heading', { level: 2, name: 'Настройки' }))
        .toHaveAttribute('id', 'section-title')
    await screen.rerender(<Typography variant="span">Описание</Typography>)
    expect(screen.getByText('Описание').element().tagName).toBe('SPAN')
    await expect.element(screen.getByRole('heading')).not.toBeInTheDocument()
})
