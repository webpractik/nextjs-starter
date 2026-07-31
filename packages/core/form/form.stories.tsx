import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { useState } from 'react'
import { z } from 'zod'

import { useAppForm } from '.'

const showcaseSchema = z.object({
    acceptsTerms: z.boolean(),
    birthDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Use DD.MM.YYYY'),
    channel: z.string(),
    confidence: z.number(),
    enabled: z.boolean(),
    projectName: z.string().min(3, 'Use at least three characters'),
    phone: z.string().regex(/^\+7 \d{3} \d{3}-\d{2}-\d{2}$/, 'Enter a complete phone'),
    seats: z.number().min(1),
    stack: z.string(),
    summary: z.string(),
})

function FormShowcase() {
    const [submittedValues, setSubmittedValues] = useState<string>()
    const form = useAppForm({
        defaultValues: {
            acceptsTerms: false,
            birthDate: '',
            channel: 'email',
            confidence: 60,
            enabled: true,
            projectName: '',
            phone: '+7 ',
            seats: 3,
            stack: 'query',
            summary: '',
        },
        onSubmit: ({ value }) => setSubmittedValues(JSON.stringify(value, null, 2)),
        validators: {
            onChange: showcaseSchema,
        },
    })

    return (
        <div className="w-full max-w-xl space-y-6">
            <form
                className="grid gap-5"
                onSubmit={(event) => {
                    event.preventDefault()
                    void form.handleSubmit()
                }}
            >
                <form.AppField name="projectName">
                    {(field) => (
                        <field.TextField
                            description="This name is shown throughout the workspace."
                            label="Project name"
                            placeholder="Apollo"
                        />
                    )}
                </form.AppField>
                <form.AppField name="birthDate">
                    {(field) => (
                        <field.DateField
                            description="Stored as a masked DD.MM.YYYY string."
                            label="Birth date"
                            placeholder="ДД.ММ.ГГГГ"
                        />
                    )}
                </form.AppField>
                <form.AppField name="phone">
                    {(field) => (
                        <field.PhoneField
                            description="Stored as a masked international string."
                            label="Phone"
                            placeholder="+7 999 123-45-67"
                        />
                    )}
                </form.AppField>
                <form.AppField name="summary">
                    {(field) => <field.TextareaField label="Summary" rows={3} />}
                </form.AppField>
                <form.AppField name="seats">
                    {(field) => <field.NumberField label="Seats" min={1} />}
                </form.AppField>
                <form.AppField name="stack">
                    {(field) => (
                        <field.SelectField
                            label="Primary library"
                            options={[
                                { label: 'TanStack Query', value: 'query' },
                                { label: 'TanStack Router', value: 'router' },
                            ]}
                        />
                    )}
                </form.AppField>
                <form.AppField name="channel">
                    {(field) => (
                        <field.RadioGroupField
                            label="Notification channel"
                            options={[
                                { label: 'Email', value: 'email' },
                                { label: 'SMS', value: 'sms' },
                            ]}
                        />
                    )}
                </form.AppField>
                <form.AppField name="confidence">
                    {(field) => <field.SliderField label="Delivery confidence" />}
                </form.AppField>
                <form.AppField name="enabled">
                    {(field) => <field.SwitchField label="Enable workspace" />}
                </form.AppField>
                <form.AppField name="acceptsTerms">
                    {(field) => <field.CheckboxField label="Accept terms" />}
                </form.AppField>
                <form.AppForm>
                    <form.SubmitButton>Save project</form.SubmitButton>
                </form.AppForm>
            </form>

            {submittedValues ? (
                <pre className="overflow-auto rounded-md bg-muted p-4 text-xs">
                    {submittedValues}
                </pre>
            ) : null}
        </div>
    )
}

const meta: Meta<typeof FormShowcase> = {
    component: FormShowcase,
    title: 'core/Form',
}

export default meta

type Story = StoryObj<typeof FormShowcase>

export const Default: Story = {}
