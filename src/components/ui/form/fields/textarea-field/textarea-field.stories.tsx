import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { TextareaFieldProps } from '.'

import { TextareaField } from '.'
import { FieldStory } from '../shared/field-story'

interface TextareaFieldStoryProps {
    defaultValue?: string
    description?: ReactNode
    disabled?: boolean
    label: ReactNode
    placeholder?: string
    rows?: TextareaFieldProps['rows']
    validate?: (_value: unknown) => string | undefined
}

function TextareaFieldStory({
    defaultValue = '',
    description,
    disabled,
    label,
    placeholder,
    rows,
    validate,
}: TextareaFieldStoryProps) {
    return (
        <FieldStory defaultValue={defaultValue} validate={validate}>
            <TextareaField
                description={description}
                disabled={disabled}
                label={label}
                placeholder={placeholder}
                rows={rows}
            />
        </FieldStory>
    )
}

const meta = {
    component: TextareaFieldStory,
    title: 'core/Form/TextareaField',
} satisfies Meta<typeof TextareaFieldStory>

export default meta

type Story = StoryObj<typeof TextareaFieldStory>

export const Default: Story = {
    args: {
        description: 'Добавьте контекст для других участников рабочего пространства.',
        label: 'Краткое описание',
        placeholder: 'Опишите цели проекта…',
        rows: 4,
    },
}

export const Prefilled: Story = {
    args: {
        defaultValue: 'Скоординировать запуск продукта между дизайном, разработкой и поддержкой.',
        label: 'Краткое описание',
        rows: 4,
    },
}

export const Validation: Story = {
    args: {
        defaultValue: 'Слишком кратко',
        description: 'Введите не менее двадцати символов.',
        label: 'Описание проекта',
        rows: 4,
        validate: (value) =>
            typeof value === 'string' && value.length >= 20
                ? undefined
                : 'Описание проекта должно содержать не менее двадцати символов',
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: 'Это описание недоступно для изменения после архивации проекта.',
        disabled: true,
        label: 'Краткое описание',
        rows: 3,
    },
}
