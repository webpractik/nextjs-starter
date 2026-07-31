import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { PhoneFieldProps } from '.'

import { useForm } from '@tanstack/react-form'

import { PhoneField } from '.'
import { fieldContext } from '../../form-context'

interface PhoneFieldStoryProps {
    defaultValue?: string
    description?: ReactNode
    disabled?: boolean
    label: ReactNode
    phoneOptions?: PhoneFieldProps['phoneOptions']
    validate?: (_value: string) => string | undefined
}

function PhoneFieldStory({
    defaultValue = '+7 ',
    description,
    disabled,
    label,
    phoneOptions,
    validate,
}: PhoneFieldStoryProps) {
    const form = useForm({ defaultValues: { value: defaultValue } })

    return (
        <div className="w-full max-w-sm space-y-3">
            <form.Field
                name="value"
                validators={{
                    onBlur: ({ value }) => validate?.(value),
                    onMount: ({ value }) => validate?.(value),
                }}
            >
                {(field) => (
                    <fieldContext.Provider value={field}>
                        <PhoneField
                            description={description}
                            disabled={disabled}
                            label={label}
                            phoneOptions={phoneOptions}
                            placeholder="+7 999 123-45-67"
                        />
                    </fieldContext.Provider>
                )}
            </form.Field>
            <form.Subscribe selector={(state) => state.values.value}>
                {(value) => (
                    <output className="block text-xs text-muted-foreground">
                        Form value: {value || 'empty'}
                    </output>
                )}
            </form.Subscribe>
        </div>
    )
}

const meta: Meta<typeof PhoneFieldStory> = {
    component: PhoneFieldStory,
    title: 'core/Form/PhoneField',
}

export default meta

type Story = StoryObj<typeof PhoneFieldStory>

export const Default: Story = {
    args: {
        description: 'Strict Russian international formatting.',
        label: 'Phone number',
    },
}

const nationalUsPhoneOptions = {
    countryIsoCode: 'US',
    format: 'NATIONAL',
    strict: true,
} as const

const completeRussianPhonePattern = /^\+7 \d{3} \d{3}-\d{2}-\d{2}$/

export const Configured: Story = {
    args: {
        defaultValue: '(202) 555-0123',
        description: 'US national format using the same controlled-string contract.',
        label: 'US phone',
        phoneOptions: nationalUsPhoneOptions,
    },
}

export const Validation: Story = {
    args: {
        defaultValue: '+7 ',
        description: 'Formatting does not replace consumer validation.',
        label: 'Contact phone',
        validate: (value) =>
            completeRussianPhonePattern.test(value) ? undefined : 'Enter all ten national digits',
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: '+7 999 123-45-67',
        disabled: true,
        label: 'Verified phone',
    },
}
