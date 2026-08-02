import { useForm } from '@tanstack/react-form'
import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { CheckboxField, SwitchField } from '.'
import { fieldContext } from '../form-context'

function ChoiceFieldsDemo() {
    const form = useForm({
        defaultValues: {
            acceptsTerms: false,
            archived: false,
            enabled: false,
        },
    })

    return (
        <>
            <form.Field name="acceptsTerms">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <CheckboxField
                            description="Required before submitting."
                            label="Accept terms"
                        />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="enabled">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <SwitchField
                            description="Controls workspace availability."
                            label="Enable workspace"
                        />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Field name="archived">
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <CheckboxField disabled label="Archived" />
                    </fieldContext.Provider>
                )}
            </form.Field>

            <form.Subscribe selector={(state) => state.values}>
                {(values) => (
                    <output aria-label="Boolean values">
                        {JSON.stringify({
                            acceptsTerms: values.acceptsTerms,
                            enabled: values.enabled,
                        })}
                    </output>
                )}
            </form.Subscribe>
        </>
    )
}

it('синхронизирует checkbox и switch с boolean-состоянием и помечает их после потери фокуса', async () => {
    const screen = await render(<ChoiceFieldsDemo />)
    const checkbox = screen.getByRole('checkbox', { name: 'Accept terms' })
    const switchControl = screen.getByRole('switch', { name: 'Enable workspace' })

    await expect.element(checkbox).not.toBeChecked()
    await expect.element(checkbox).toHaveAccessibleDescription('Required before submitting.')
    await checkbox.click()
    await userEvent.tab()

    await expect.element(checkbox).toBeChecked()
    expect(checkbox.element().closest('[data-slot="field"]')).toHaveAttribute(
        'data-touched',
        'true',
    )

    await expect.element(switchControl).not.toBeChecked()
    await expect
        .element(switchControl)
        .toHaveAccessibleDescription('Controls workspace availability.')
    await switchControl.click()
    await userEvent.tab()

    await expect.element(switchControl).toBeChecked()
    expect(switchControl.element().closest('[data-slot="field"]')).toHaveAttribute(
        'data-touched',
        'true',
    )
    await expect
        .element(screen.getByRole('status', { name: 'Boolean values' }))
        .toHaveTextContent('{"acceptsTerms":true,"enabled":true}')
})

it('делает отключённый checkbox недоступным и помечает его контейнер', async () => {
    const screen = await render(<ChoiceFieldsDemo />)
    const checkbox = screen.getByRole('checkbox', { name: 'Archived' })

    await expect.element(checkbox).toBeDisabled()
    expect(checkbox.element().closest('[data-slot="field"]')).toHaveAttribute(
        'data-disabled',
        'true',
    )
})
