import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { useState } from 'react'
import { z } from 'zod'

import { useAppForm } from '.'

const showcaseSchema = z.object({
    acceptsTerms: z.boolean(),
    birthDate: z.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, 'Используйте формат ДД.ММ.ГГГГ'),
    channel: z.string(),
    confidence: z.number(),
    enabled: z.boolean(),
    projectName: z.string().min(3, 'Введите не менее трёх символов'),
    phone: z.string().regex(/^\+7 \d{3} \d{3}-\d{2}-\d{2}$/, 'Введите номер полностью'),
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
                            description="Это название отображается во всём рабочем пространстве."
                            label="Название проекта"
                            placeholder="Аполлон"
                        />
                    )}
                </form.AppField>
                <form.AppField name="birthDate">
                    {(field) => (
                        <field.DateField
                            description="Сохраняется как строка в формате ДД.ММ.ГГГГ."
                            label="Дата рождения"
                            placeholder="ДД.ММ.ГГГГ"
                        />
                    )}
                </form.AppField>
                <form.AppField name="phone">
                    {(field) => (
                        <field.PhoneField
                            description="Сохраняется как строка в международном формате."
                            label="Телефон"
                            placeholder="+7 999 123-45-67"
                        />
                    )}
                </form.AppField>
                <form.AppField name="summary">
                    {(field) => <field.TextareaField label="Краткое описание" rows={3} />}
                </form.AppField>
                <form.AppField name="seats">
                    {(field) => <field.NumberField label="Количество мест" min={1} />}
                </form.AppField>
                <form.AppField name="stack">
                    {(field) => (
                        <field.SelectField
                            label="Основная библиотека"
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
                            label="Канал уведомлений"
                            options={[
                                { label: 'Электронная почта', value: 'email' },
                                { label: 'СМС', value: 'sms' },
                            ]}
                        />
                    )}
                </form.AppField>
                <form.AppField name="confidence">
                    {(field) => <field.SliderField label="Уверенность в сроках" />}
                </form.AppField>
                <form.AppField name="enabled">
                    {(field) => <field.SwitchField label="Включить рабочее пространство" />}
                </form.AppField>
                <form.AppField name="acceptsTerms">
                    {(field) => <field.CheckboxField label="Принять условия" />}
                </form.AppField>
                <form.AppForm>
                    <form.SubmitButton>Сохранить проект</form.SubmitButton>
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
