import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { DateFieldProps } from '.'

import { DateField } from '.'
import { FieldStory } from '../shared/field-story'

interface DateFieldStoryProps {
    dateOptions?: DateFieldProps['dateOptions']
    defaultValue?: string
    description?: ReactNode
    disabled?: boolean
    label: ReactNode
    validate?: (_value: unknown) => string | undefined
}

function DateFieldStory({
    dateOptions,
    defaultValue = '',
    description,
    disabled,
    label,
    validate,
}: DateFieldStoryProps) {
    return (
        <FieldStory defaultValue={defaultValue} validate={validate}>
            <DateField
                dateOptions={dateOptions}
                description={description}
                disabled={disabled}
                label={label}
                placeholder="ДД.ММ.ГГГГ"
            />
        </FieldStory>
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
        description: 'Строка с маской сохраняется в состоянии формы.',
        label: 'Дата рождения',
    },
}

const ruDateOptions = {
    locale: 'ru-RU',
    max: new Date(2030, 11, 31),
    min: new Date(2020, 0, 1),
}

export const Configured: Story = {
    args: {
        dateOptions: ruDateOptions,
        defaultValue: '31.12.2026',
        description: 'Русская локаль, доступны календарные годы с 2020-го по 2030-й.',
        label: 'Дата проверки',
    },
}

export const Validation: Story = {
    args: {
        defaultValue: '01.01.2026',
        description: 'В этом примере требуется последний день 2026 года.',
        label: 'Срок',
        validate: (value) => (value === '31.12.2026' ? undefined : 'Укажите срок 31.12.2026'),
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: '31.12.2026',
        disabled: true,
        label: 'Архивная дата',
    },
}
