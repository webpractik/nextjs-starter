import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { Label } from '#/components/ui/label'

it('связывает подпись с полем и переводит фокус по нажатию', async () => {
    const screen = await render(
        <>
            <Label htmlFor="name">Имя</Label>
            <input id="name" />
        </>,
    )
    await screen.getByText('Имя').click()
    await expect.element(screen.getByRole('textbox', { name: 'Имя' })).toHaveFocus()
})
