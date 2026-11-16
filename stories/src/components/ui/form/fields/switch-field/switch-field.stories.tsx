import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { SwitchFieldProps } from '../../../../../../../src/components/ui/form/fields/switch-field'

import { FieldStory } from '../../../../../../../src/components/ui/form/fields/shared/field-story'
import { SwitchField } from '../../../../../../../src/components/ui/form/fields/switch-field'

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

const meta = {
    component: SwitchFieldStory,
    title: 'core/Form/SwitchField',
} satisfies Meta<typeof SwitchFieldStory>

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
