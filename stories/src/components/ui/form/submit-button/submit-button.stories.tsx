import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { useState } from 'react'
import { z } from 'zod'

import { SubmitButton, useAppForm } from '#/components/ui/form'

interface SubmitButtonShowcaseProps {
    disabled?: boolean
}

function SubmitButtonShowcase({ disabled = false }: SubmitButtonShowcaseProps) {
    const [submitted, setSubmitted] = useState('')
    const form = useAppForm({
        defaultValues: { name: '' },
        onSubmit: ({ value }) => setSubmitted(value.name),
        validators: {
            onChange: z.object({ name: z.string().min(3, 'Введите не менее трёх символов') }),
        },
    })

    return (
        <form
            className="w-full max-w-sm space-y-3"
            onSubmit={(event) => {
                event.preventDefault()
                void form.handleSubmit()
            }}
        >
            <form.AppField name="name">
                {(field) => <field.TextField label="Название проекта" />}
            </form.AppField>
            <form.AppForm>
                <SubmitButton disabled={disabled}>Сохранить</SubmitButton>
            </form.AppForm>
            <output className="block">
                {submitted ? `Сохранено: ${submitted}` : 'Данные ещё не отправлены'}
            </output>
        </form>
    )
}

const meta = {
    component: SubmitButtonShowcase,
    title: 'core/Form/SubmitButton',
} satisfies Meta<typeof SubmitButtonShowcase>

export default meta

type Story = StoryObj<typeof meta>

export const ValidatedForm: Story = {}
export const Disabled: Story = { args: { disabled: true } }
