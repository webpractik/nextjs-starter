import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { PhoneField } from '#/components/ui/form'
import { FieldStory } from '#/components/ui/form/fields/shared/field-story'

it('форматирует российский номер и сохраняет телефонную семантику', async () => {
    const screen = await render(
        <FieldStory defaultValue="">
            <PhoneField label="Телефон" />
        </FieldStory>,
    )
    const input = screen.getByRole('textbox', { name: 'Телефон' })
    await userEvent.type(input, '79991234567')
    await expect.element(input).toHaveValue('+7 999 123-45-67')
    await expect.element(input).toHaveAttribute('type', 'tel')
    await expect.element(input).toHaveAttribute('autocomplete', 'tel')
    await expect.element(screen.getByRole('status')).toMatchTextContent('+7 999 123-45-67')
})
