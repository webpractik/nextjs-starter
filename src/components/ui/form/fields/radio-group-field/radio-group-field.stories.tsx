import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { RadioGroupFieldProps } from '.'

import { RadioGroupField } from '.'
import { FieldStory } from '../shared/field-story'

interface RadioGroupFieldStoryProps {
    defaultValue?: string
    description?: ReactNode
    disabled?: boolean
    groupClassName?: string
    label: ReactNode
    options: RadioGroupFieldProps['options']
    validate?: (_value: unknown) => string | undefined
}

function RadioGroupFieldStory({
    defaultValue = '',
    description,
    disabled,
    groupClassName,
    label,
    options,
    validate,
}: RadioGroupFieldStoryProps) {
    return (
        <FieldStory
            className="w-full max-w-md space-y-3"
            defaultValue={defaultValue}
            validate={validate}
        >
            <RadioGroupField
                description={description}
                disabled={disabled}
                groupClassName={groupClassName}
                label={label}
                options={options}
            />
        </FieldStory>
    )
}

const meta = {
    component: RadioGroupFieldStory,
    title: 'core/Form/RadioGroupField',
} satisfies Meta<typeof RadioGroupFieldStory>

export default meta

type Story = StoryObj<typeof RadioGroupFieldStory>

const channelOptions = [
    {
        description: 'Подходит для подробных обновлений и еженедельных сводок.',
        label: 'Электронная почта',
        value: 'email',
    },
    {
        description: 'Подходит для срочных уведомлений.',
        label: 'СМС',
        value: 'sms',
    },
    {
        description: 'Недоступно на текущем тарифе.',
        disabled: true,
        label: 'Пуш-уведомление',
        value: 'push',
    },
] as const

export const Default: Story = {
    args: {
        defaultValue: 'email',
        description: 'Выберите, куда отправлять уведомления о доставке.',
        label: 'Канал уведомлений',
        options: channelOptions,
    },
}

export const Compact: Story = {
    args: {
        defaultValue: 'monthly',
        groupClassName: 'sm:grid-cols-3',
        label: 'Расчётный период',
        options: [
            { label: 'Ежемесячно', value: 'monthly' },
            { label: 'Ежеквартально', value: 'quarterly' },
            { label: 'Ежегодно', value: 'yearly' },
        ],
    },
}

export const Validation: Story = {
    args: {
        description: 'Для продолжения выберите один канал.',
        label: 'Канал уведомлений',
        options: channelOptions,
        validate: (value) =>
            typeof value === 'string' && value ? undefined : 'Выберите канал уведомлений',
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: 'email',
        disabled: true,
        label: 'Канал уведомлений',
        options: channelOptions,
    },
}
