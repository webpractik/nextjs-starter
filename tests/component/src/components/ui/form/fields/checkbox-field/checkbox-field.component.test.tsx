import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { CheckboxField } from '#/components/ui/form'
import { FieldStory } from '#/components/ui/form/fields/shared/field-story'

it('сохраняет переключённое boolean-значение и отражает disabled', async () => {
    const screen = await render(
        <FieldStory defaultValue={false}>
            <CheckboxField label="Уведомления" />
        </FieldStory>,
    )
    const control = screen.getByRole('checkbox', { name: 'Уведомления' })
    await expect.element(control).not.toBeChecked()
    await control.click()
    await expect.element(control).toBeChecked()
    await expect.element(screen.getByRole('status')).toHaveTextContent('Значение формы: true')
    await screen.rerender(
        <FieldStory defaultValue={false}>
            <CheckboxField label="Уведомления" disabled />
        </FieldStory>,
    )
    await expect.element(screen.getByRole('checkbox', { name: 'Уведомления' })).toBeDisabled()
})
