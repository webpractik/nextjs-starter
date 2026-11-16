import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { TextField } from '#/components/ui/form'
import { FieldStory } from '#/components/ui/form/fields/shared/field-story'

it('сохраняет ввод и связывает ошибку валидации с полем после blur', async () => {
    const screen = await render(
        <FieldStory
            defaultValue=""
            validate={(value) => (value === 'Готово' ? undefined : 'Введите Готово')}
        >
            <TextField label="Название" description="Название задачи" />
        </FieldStory>,
    )
    const input = screen.getByRole('textbox', { name: 'Название' })
    await expect.element(input).toHaveAccessibleDescription('Название задачи Введите Готово')
    await input.fill('Готово')
    await userEvent.tab()
    await expect.element(input).toHaveAttribute('aria-invalid', 'false')
    await expect.element(screen.getByRole('status')).toHaveTextContent('Значение формы: Готово')
})
