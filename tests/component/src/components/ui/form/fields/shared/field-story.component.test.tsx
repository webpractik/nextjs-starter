import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { TextField } from '#/components/ui/form'
import { FieldStory } from '#/components/ui/form/fields/shared/field-story'

it.each([
    { expected: 'пусто', value: '' },
    { expected: 'не задано', value: undefined },
    { expected: 'false', value: false },
    { expected: '[1,2]', value: [1, 2] },
    { expected: 'Symbol(label)', value: Symbol('label') },
])('отображает значение $expected без потери типа', async ({ expected, value }) => {
    const screen = await render(
        <FieldStory defaultValue={value}>
            <span>Пример</span>
        </FieldStory>,
    )
    await expect
        .element(screen.getByRole('status'))
        .toHaveTextContent(`Значение формы: ${expected}`)
})

it('сбрасывает изменённое значение при смене исходного значения примера', async () => {
    const screen = await render(
        <FieldStory defaultValue="Первый">
            <TextField label="Название" />
        </FieldStory>,
    )
    await screen.getByRole('textbox', { name: 'Название' }).fill('Правка')
    await screen.rerender(
        <FieldStory defaultValue="Второй">
            <TextField label="Название" />
        </FieldStory>,
    )
    await expect.element(screen.getByRole('textbox', { name: 'Название' })).toHaveValue('Второй')
    await expect.element(screen.getByRole('status')).toHaveTextContent('Значение формы: Второй')
})
