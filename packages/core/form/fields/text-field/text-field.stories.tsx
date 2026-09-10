import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { TextFieldProps } from '.'

import { TextField } from '.'
import { FieldStory } from '../shared/field-story'

interface TextFieldStoryProps {
    defaultValue?: string
    description?: ReactNode
    disabled?: boolean
    label: ReactNode
    placeholder?: string
    type?: TextFieldProps['type']
    validate?: (_value: unknown) => string | undefined
}

function TextFieldStory({
    defaultValue = '',
    description,
    disabled,
    label,
    placeholder,
    type,
    validate,
}: TextFieldStoryProps) {
    return (
        <FieldStory defaultValue={defaultValue} validate={validate}>
            <TextField
                description={description}
                disabled={disabled}
                label={label}
                placeholder={placeholder}
                type={type}
            />
        </FieldStory>
    )
}

const meta = {
    component: TextFieldStory,
    title: 'core/Form/TextField',
} satisfies Meta<typeof TextFieldStory>

export default meta

type Story = StoryObj<typeof TextFieldStory>

export const Default: Story = {
    args: {
        description: 'Отображается во всём рабочем пространстве.',
        label: 'Название проекта',
        placeholder: 'Аполлон',
    },
}

export const Email: Story = {
    args: {
        defaultValue: 'team@example.com',
        description: 'Используется для уведомлений об аккаунте.',
        label: 'Электронная почта',
        type: 'email',
    },
}

export const Validation: Story = {
    args: {
        defaultValue: 'ИИ',
        description: 'Введите не менее трёх символов.',
        label: 'Название проекта',
        validate: (value) =>
            typeof value === 'string' && value.length >= 3
                ? undefined
                : 'Название проекта должно содержать не менее трёх символов',
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: 'Архивное рабочее пространство',
        disabled: true,
        label: 'Название проекта',
    },
}
