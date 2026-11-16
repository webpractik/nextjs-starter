import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { TextareaField } from '#/components/ui/form'
import { FieldStory } from '#/components/ui/form/fields/shared/field-story'

it('сохраняет многострочный текст в состоянии формы', async () => {
    const screen = await render(
        <FieldStory defaultValue="">
            <TextareaField label="Описание" rows={4} />
        </FieldStory>,
    )
    const input = screen.getByRole('textbox', { name: 'Описание' })
    await input.fill('Первая строка\nВторая строка')
    await expect.element(input).toHaveValue('Первая строка\nВторая строка')
    await expect
        .element(screen.getByRole('status'))
        .toMatchTextContent('Первая строка Вторая строка')
    await expect.element(input).toHaveAttribute('rows', '4')
})
