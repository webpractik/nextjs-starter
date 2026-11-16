import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { SelectField } from '#/components/ui/form'
import { FieldStory } from '#/components/ui/form/fields/shared/field-story'

it('сохраняет выбранную опцию и оставляет отключённую недоступной', async () => {
    const screen = await render(
        <FieldStory defaultValue="first">
            <SelectField
                label="Проект"
                options={[
                    { label: 'Первый', value: 'first' },
                    { label: 'Второй', value: 'second' },
                    { disabled: true, label: 'Архив', value: 'archive' },
                ]}
            />
        </FieldStory>,
    )
    await screen.getByRole('combobox', { name: 'Проект' }).click()
    await expect
        .element(screen.getByRole('option', { name: 'Архив' }))
        .toHaveAttribute('aria-disabled', 'true')
    await screen.getByRole('option', { name: 'Второй' }).click()
    await expect
        .element(screen.getByRole('combobox', { name: 'Проект' }))
        .toMatchTextContent('Второй')
    await expect.element(screen.getByRole('status')).toMatchTextContent('Значение формы: second')
})
