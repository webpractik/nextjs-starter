import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { RadioGroupField } from '#/components/ui/form'
import { FieldStory } from '#/components/ui/form/fields/shared/field-story'

it('связывает подписи вариантов и сохраняет выбранное значение', async () => {
    const screen = await render(
        <FieldStory defaultValue="email">
            <RadioGroupField
                label="Канал"
                options={[
                    { label: 'Почта', value: 'email' },
                    { description: 'Мгновенные уведомления', label: 'SMS', value: 'sms' },
                    { disabled: true, label: 'Архив', value: 'archive' },
                ]}
            />
        </FieldStory>,
    )
    await expect.element(screen.getByRole('radiogroup', { name: 'Канал' })).toBeVisible()
    const sms = screen.getByRole('radio', { name: 'SMS' })
    await expect.element(sms).toHaveAccessibleDescription('Мгновенные уведомления')
    await sms.click()
    await expect.element(sms).toBeChecked()
    await expect.element(screen.getByRole('radio', { name: 'Архив' })).toBeDisabled()
    await expect.element(screen.getByRole('status')).toHaveTextContent('Значение формы: sms')
})
