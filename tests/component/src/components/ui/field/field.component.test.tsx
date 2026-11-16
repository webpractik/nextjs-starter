import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import {
    Field,
    FieldDescription,
    FieldError,
    FieldLabel,
    FieldLegend,
    FieldSet,
} from '#/components/ui/field'

it('связывает группу полей, подпись и описание с контролом', async () => {
    const screen = await render(
        <FieldSet>
            <FieldLegend>Контакты</FieldLegend>
            <Field>
                <FieldLabel htmlFor="contact">Почта</FieldLabel>
                <input id="contact" aria-describedby="contact-description" />
                <FieldDescription id="contact-description">Для уведомлений</FieldDescription>
            </Field>
        </FieldSet>,
    )
    await expect.element(screen.getByRole('group', { name: 'Контакты' })).toBeInTheDocument()
    await expect
        .element(screen.getByRole('textbox', { name: 'Почта' }))
        .toHaveAccessibleDescription('Для уведомлений')
})

it('устраняет повторяющиеся ошибки и скрывает пустую ошибку', async () => {
    const screen = await render(
        <FieldError
            errors={[
                { message: 'Обязательное поле' },
                { message: 'Обязательное поле' },
                { message: 'Неверный формат' },
            ]}
        />,
    )
    const alert = screen.getByRole('alert')
    await expect.element(alert).toMatchTextContent('Обязательное поле')
    expect(alert.element().querySelectorAll('li')).toHaveLength(2)
    await screen.rerender(<FieldError errors={[]} />)
    await expect.element(screen.getByRole('alert')).not.toBeInTheDocument()
})
