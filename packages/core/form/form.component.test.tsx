import type { ComponentProps } from 'react'

import { useAppForm } from '@repo/core/form'
import { expect, expectTypeOf, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'
import { z } from 'zod'

const formSchema = z.object({
    acceptsTerms: z.boolean(),
    channel: z.string(),
    confidence: z.number(),
    enabled: z.boolean(),
    projectName: z.string().min(3, 'Use at least three characters'),
    seats: z.number().min(1),
    stack: z.string(),
    summary: z.string(),
})

interface DemoFormValues {
    acceptsTerms: boolean
    channel: string
    confidence: number
    enabled: boolean
    projectName: string
    seats: number
    stack: string
    summary: string
}

const defaultValues: DemoFormValues = {
    acceptsTerms: false,
    channel: 'email',
    confidence: 40,
    enabled: false,
    projectName: '',
    seats: 1,
    stack: 'start',
    summary: 'Initial summary',
}

function DemoForm({ onSubmit }: { onSubmit: (_values: DemoFormValues) => void }) {
    const form = useAppForm({
        defaultValues,
        onSubmit: ({ value }) => onSubmit(value),
        validators: {
            onChange: formSchema,
        },
    })

    expectTypeOf(form.state.values).toEqualTypeOf<DemoFormValues>()
    expectTypeOf(form.state.values).not.toBeAny()
    expectTypeOf<ComponentProps<typeof form.AppField>['name']>().toEqualTypeOf<
        keyof DemoFormValues
    >()
    expectTypeOf<ComponentProps<typeof form.AppField>['name']>().not.toBeAny()

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                event.stopPropagation()
                void form.handleSubmit()
            }}
        >
            <form.AppField name="projectName">
                {(field) => <field.TextField label="Project name" />}
            </form.AppField>
            <form.AppField name="summary">
                {(field) => <field.TextareaField label="Summary" />}
            </form.AppField>
            <form.AppField name="seats">
                {(field) => <field.NumberField label="Seats" />}
            </form.AppField>
            <form.AppField name="acceptsTerms">
                {(field) => <field.CheckboxField label="Accept terms" />}
            </form.AppField>
            <form.AppField name="enabled">
                {(field) => <field.SwitchField label="Enable workspace" />}
            </form.AppField>
            <form.AppField name="stack">
                {(field) => (
                    <field.SelectField
                        label="Stack"
                        options={[
                            { label: 'TanStack Start', value: 'start' },
                            { label: 'TanStack Query', value: 'query' },
                        ]}
                    />
                )}
            </form.AppField>
            <form.AppField name="channel">
                {(field) => (
                    <field.RadioGroupField
                        label="Notification channel"
                        options={[
                            { label: 'Email alerts', value: 'email' },
                            { label: 'SMS alerts', value: 'sms' },
                        ]}
                    />
                )}
            </form.AppField>
            <form.AppField name="confidence">
                {(field) => <field.SliderField label="Confidence" />}
            </form.AppField>

            <form.AppForm>
                <form.SubmitButton>Submit demo</form.SubmitButton>
            </form.AppForm>
        </form>
    )
}

it('submits inferred values from every registered field with direct Zod validation', async () => {
    const onSubmit = vi.fn<(_values: DemoFormValues) => void>()
    const screen = await render(<DemoForm onSubmit={onSubmit} />)
    const projectName = screen.getByRole('textbox', { name: 'Project name' })
    const submit = screen.getByRole('button', { name: 'Submit demo' })

    await projectName.fill('x')

    await expect
        .element(screen.getByRole('alert'))
        .toHaveTextContent('Use at least three characters')
    await expect.element(submit).toBeDisabled()

    await projectName.fill('Apollo')
    await screen.getByRole('textbox', { name: 'Summary' }).fill('Launch checklist')
    await screen.getByRole('spinbutton', { name: 'Seats' }).fill('7')
    await screen.getByRole('checkbox', { name: 'Accept terms' }).click()
    await screen.getByRole('switch', { name: 'Enable workspace' }).click()
    await screen.getByRole('combobox', { name: 'Stack' }).click()
    await screen.getByRole('option', { name: 'TanStack Query' }).click()
    await screen.getByRole('radio', { name: 'SMS alerts' }).click()

    const slider = screen.getByRole('slider', { exact: true, name: 'Confidence' })
    slider.element().focus()
    await userEvent.keyboard('{ArrowRight}')

    await expect.element(submit).toBeEnabled()
    await submit.click()

    await expect
        .poll(() => onSubmit.mock.calls.at(0)?.at(0))
        .toEqual({
            acceptsTerms: true,
            channel: 'sms',
            confidence: 41,
            enabled: true,
            projectName: 'Apollo',
            seats: 7,
            stack: 'query',
            summary: 'Launch checklist',
        })
})
