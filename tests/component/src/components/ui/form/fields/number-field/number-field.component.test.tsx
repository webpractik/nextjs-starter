import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { NumberField } from '#/components/ui/form'
import { FieldStory } from '#/components/ui/form/fields/shared/field-story'

it('преобразует число и сохраняет заданное пустое значение после очистки', async () => {
    const screen = await render(
        <FieldStory defaultValue={2}>
            <NumberField emptyValue={null} label="Места" />
        </FieldStory>,
    )
    const input = screen.getByRole('spinbutton', { name: 'Места' })
    await input.fill('12')
    await expect.element(screen.getByRole('status')).toHaveTextContent('Значение формы: 12')
    await input.fill('')
    await expect.element(input).toHaveValue(null)
    await expect.element(screen.getByRole('status')).toHaveTextContent('Значение формы: null')
})
