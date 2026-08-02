import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { SelectFieldProps } from '.'

import { SelectField } from '.'
import { FieldStory } from '../shared/field-story'

interface SelectFieldStoryProps {
    defaultValue?: string
    description?: ReactNode
    disabled?: boolean
    label: ReactNode
    options: SelectFieldProps['options']
    placeholder?: ReactNode
    validate?: (_value: unknown) => string | undefined
}

function SelectFieldStory({
    defaultValue = '',
    description,
    disabled,
    label,
    options,
    placeholder,
    validate,
}: SelectFieldStoryProps) {
    return (
        <FieldStory defaultValue={defaultValue} validate={validate}>
            <SelectField
                description={description}
                disabled={disabled}
                label={label}
                options={options}
                placeholder={placeholder}
            />
        </FieldStory>
    )
}

const meta: Meta<typeof SelectFieldStory> = {
    component: SelectFieldStory,
    title: 'core/Form/SelectField',
}

export default meta

type Story = StoryObj<typeof SelectFieldStory>

const libraryOptions = [
    { label: 'TanStack Query', value: 'query' },
    { label: 'TanStack Router', value: 'router' },
    { disabled: true, label: 'TanStack Start (скоро)', value: 'start' },
] as const

export const Default: Story = {
    args: {
        defaultValue: 'query',
        description: 'Выберите основную библиотеку для этого рабочего пространства.',
        label: 'Основная библиотека',
        options: libraryOptions,
    },
}

export const Placeholder: Story = {
    args: {
        label: 'Основная библиотека',
        options: libraryOptions,
        placeholder: 'Выберите библиотеку',
    },
}

export const Validation: Story = {
    args: {
        description: 'Необходимо выбрать основную библиотеку.',
        label: 'Основная библиотека',
        options: libraryOptions,
        placeholder: 'Выберите библиотеку',
        validate: (value) =>
            typeof value === 'string' && value ? undefined : 'Выберите основную библиотеку',
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: 'router',
        disabled: true,
        label: 'Основная библиотека',
        options: libraryOptions,
    },
}
