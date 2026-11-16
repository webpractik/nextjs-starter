import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { DateField } from '#/components/ui/form'
import { FieldStory } from '#/components/ui/form/fields/shared/field-story'

it('маскирует восемь цифр и сохраняет форматированную дату в форме', async () => {
    const screen = await render(
        <FieldStory defaultValue="">
            <DateField label="Дата" />
        </FieldStory>,
    )
    const input = screen.getByRole('textbox', { name: 'Дата' })
    await userEvent.type(input, '31122026')
    await expect.element(input).toHaveValue('31.12.2026')
    await expect.element(screen.getByRole('status')).toHaveTextContent('Значение формы: 31.12.2026')
})
