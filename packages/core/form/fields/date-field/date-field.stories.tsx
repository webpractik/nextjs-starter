import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { DateFieldProps } from '.'

import { useForm } from '@tanstack/react-form'

import { DateField } from '.'
import { fieldContext } from '../../form-context'

interface DateFieldStoryProps {
    dateOptions?: DateFieldProps['dateOptions']
    defaultValue?: string
    description?: ReactNode
    disabled?: boolean
    label: ReactNode
    validate?: (_value: string) => string | undefined
}

function DateFieldStory({
    dateOptions,
    defaultValue = '',
    description,
    disabled,
    label,
    validate,
}: DateFieldStoryProps) {
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
                        <DateField
                            dateOptions={dateOptions}
                            description={description}
                            disabled={disabled}
                            label={label}
                            placeholder="ДД.ММ.ГГГГ"
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

const meta: Meta<typeof DateFieldStory> = {
    component: DateFieldStory,
    title: 'core/Form/DateField',
}

export default meta

type Story = StoryObj<typeof DateFieldStory>

export const Default: Story = {
    args: {
        description: 'The masked display string is stored in form state.',
        label: 'Birth date',
    },
}

const usDateOptions = {
    locale: 'en-US',
    max: new Date(2030, 11, 31),
    min: new Date(2020, 0, 1),
}

export const Configured: Story = {
    args: {
        dateOptions: usDateOptions,
        defaultValue: '12/31/2026',
        description: 'US locale, constrained to calendar years 2020–2030.',
        label: 'Review date',
    },
}

export const Validation: Story = {
    args: {
        defaultValue: '01.01.2026',
        description: 'This example requires the end of 2026.',
        label: 'Deadline',
        validate: (value) => (value === '31.12.2026' ? undefined : 'Deadline must be 31.12.2026'),
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: '31.12.2026',
        disabled: true,
        label: 'Archived date',
    },
}
