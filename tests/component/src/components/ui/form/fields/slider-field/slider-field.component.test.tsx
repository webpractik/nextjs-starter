import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { SliderField } from '#/components/ui/form'
import { FieldStory } from '#/components/ui/form/fields/shared/field-story'

it('обновляет значение формы с клавиатуры и показывает форматированную подпись', async () => {
    const screen = await render(
        <FieldStory defaultValue={40}>
            <SliderField formatValue={(value) => `${String(value)}%`} label="Готовность" />
        </FieldStory>,
    )
    const slider = screen.getByRole('slider', { name: 'Готовность' })
    slider.element().focus()
    await userEvent.keyboard('{ArrowRight}')
    await expect.element(slider).toHaveValue('41')
    await expect.element(screen.getByText('41%')).toBeVisible()
    await expect
        .element(screen.getByText('Значение формы: 41'))
        .toHaveTextContent('Значение формы: 41')
})
