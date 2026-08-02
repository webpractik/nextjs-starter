import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { SwitchFieldProps } from '.'

import { SwitchField } from '.'
import { FieldStory } from '../shared/field-story'

interface SwitchFieldStoryProps {
    defaultValue?: boolean
    description?: ReactNode
    disabled?: boolean
    label: ReactNode
    size?: SwitchFieldProps['size']
    validate?: (_value: unknown) => string | undefined
}

function SwitchFieldStory({
    defaultValue = false,
    description,
    disabled,
    label,
    size,
    validate,
}: SwitchFieldStoryProps) {
    return (
        <FieldStory defaultValue={defaultValue} validate={validate}>
            <SwitchField description={description} disabled={disabled} label={label} size={size} />
        </FieldStory>
    )
}

const meta: Meta<typeof SwitchFieldStory> = {
    component: SwitchFieldStory,
    title: 'core/Form/SwitchField',
}

export default meta

type Story = StoryObj<typeof SwitchFieldStory>

export const Default: Story = {
    args: {
        description: 'Определяет, могут ли участники открыть это рабочее пространство.',
        label: 'Включить рабочее пространство',
    },
}

export const Enabled: Story = {
    args: {
        defaultValue: true,
        label: 'Уведомления по электронной почте',
    },
}

export const Small: Story = {
    args: {
        defaultValue: true,
        label: 'Компактная настройка',
        size: 'sm',
    },
}

export const Validation: Story = {
    args: {
        description: 'Эта настройка обязательна для рабочих пространств в продакшене.',
        label: 'Включить журнал аудита',
        validate: (value) =>
            value === true ? undefined : 'Включите журнал аудита, чтобы продолжить',
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: true,
        disabled: true,
        description: 'Управляется вашей организацией.',
        label: 'Требовать двухфакторную аутентификацию',
    },
}
