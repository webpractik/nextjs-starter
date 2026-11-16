import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { PhoneFieldProps } from '.'

import { PhoneField } from '.'
import { FieldStory } from '../shared/field-story'

interface PhoneFieldStoryProps {
    defaultValue?: string
    description?: ReactNode
    disabled?: boolean
    label: ReactNode
    phoneOptions?: PhoneFieldProps['phoneOptions']
    validate?: (_value: unknown) => string | undefined
}

function PhoneFieldStory({
    defaultValue = '+7 ',
    description,
    disabled,
    label,
    phoneOptions,
    validate,
}: PhoneFieldStoryProps) {
    return (
        <FieldStory defaultValue={defaultValue} validate={validate}>
            <PhoneField
                description={description}
                disabled={disabled}
                label={label}
                phoneOptions={phoneOptions}
                placeholder="+7 999 123-45-67"
            />
        </FieldStory>
    )
}

const meta = {
    component: PhoneFieldStory,
    title: 'core/Form/PhoneField',
} satisfies Meta<typeof PhoneFieldStory>

export default meta

type Story = StoryObj<typeof PhoneFieldStory>

export const Default: Story = {
    args: {
        description: 'Строгое форматирование российского номера в международном формате.',
        label: 'Номер телефона',
    },
}

const nationalRuPhoneOptions = {
    countryIsoCode: 'RU',
    format: 'NATIONAL',
    strict: true,
} as const

const completeRussianPhonePattern = /^\+7 \d{3} \d{3}-\d{2}-\d{2}$/

export const Configured: Story = {
    args: {
        defaultValue: '8 (999) 123-45-67',
        description: 'Российский национальный формат с тем же строковым контрактом.',
        label: 'Российский номер',
        phoneOptions: nationalRuPhoneOptions,
    },
}

export const Validation: Story = {
    args: {
        defaultValue: '+7 ',
        description: 'Форматирование не заменяет пользовательскую валидацию.',
        label: 'Контактный телефон',
        validate: (value) =>
            typeof value === 'string' && completeRussianPhonePattern.test(value)
                ? undefined
                : 'Введите все десять цифр номера',
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: '+7 999 123-45-67',
        disabled: true,
        label: 'Подтверждённый телефон',
    },
}
