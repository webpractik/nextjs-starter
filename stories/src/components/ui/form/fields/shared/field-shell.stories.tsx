import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { useForm } from '@tanstack/react-form'

import { Input } from '#/components/ui/input'

import { FieldShell } from '../../../../../../../src/components/ui/form/fields/shared/field-shell'

interface FieldShellShowcaseProps {
    defaultValue?: string
    disabled?: boolean
}

function FieldShellShowcase({ defaultValue = '', disabled = false }: FieldShellShowcaseProps) {
    const form = useForm({ defaultValues: { name: defaultValue } })

    return (
        <div className="w-full max-w-sm">
            <form.Field
                name="name"
                validators={{
                    onBlur: ({ value }) =>
                        value.length < 3 ? 'Введите не менее трёх символов' : undefined,
                }}
            >
                {(field) => (
                    <FieldShell
                        description="Ошибка отображается после потери фокуса."
                        disabled={disabled}
                        field={field}
                        label="Название проекта"
                    >
                        {(controlProps) => (
                            <Input
                                {...controlProps}
                                disabled={disabled}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(event) => field.handleChange(event.currentTarget.value)}
                            />
                        )}
                    </FieldShell>
                )}
            </form.Field>
        </div>
    )
}

const meta = {
    component: FieldShellShowcase,
    title: 'core/Form/Internal/FieldShell',
} satisfies Meta<typeof FieldShellShowcase>

export default meta

type Story = StoryObj<typeof meta>

export const Validation: Story = {}
export const Disabled: Story = { args: { disabled: true, defaultValue: 'Архивный проект' } }
