import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { SliderFieldProps, SliderFieldValue } from '.'

import { SliderField } from '.'
import { FieldStory } from '../shared/field-story'

interface SliderFieldStoryProps {
    defaultValue?: SliderFieldValue
    description?: ReactNode
    disabled?: boolean
    formatValue?: SliderFieldProps['formatValue']
    getThumbLabel?: SliderFieldProps['getThumbLabel']
    label: ReactNode
    max?: SliderFieldProps['max']
    min?: SliderFieldProps['min']
    showValue?: boolean
    step?: SliderFieldProps['step']
    validate?: (_value: unknown) => string | undefined
}

function SliderFieldStory({
    defaultValue = 40,
    description,
    disabled,
    formatValue,
    getThumbLabel,
    label,
    max,
    min,
    showValue,
    step,
    validate,
}: SliderFieldStoryProps) {
    return (
        <FieldStory
            className="w-full max-w-md space-y-3"
            defaultValue={defaultValue}
            validate={validate}
        >
            <SliderField
                description={description}
                disabled={disabled}
                formatValue={formatValue}
                getThumbLabel={getThumbLabel}
                label={label}
                max={max}
                min={min}
                showValue={showValue}
                step={step}
            />
        </FieldStory>
    )
}

const meta: Meta<typeof SliderFieldStory> = {
    component: SliderFieldStory,
    title: 'core/Form/SliderField',
}

export default meta

type Story = StoryObj<typeof SliderFieldStory>

export const Default: Story = {
    args: {
        defaultValue: 60,
        description: 'Оцените вероятность завершения работы в срок.',
        formatValue: (value) => `${value}%`,
        label: 'Уверенность в сроках',
    },
}

export const Range: Story = {
    args: {
        defaultValue: [20, 80],
        description: 'Задайте ожидаемый диапазон уверенности.',
        formatValue: (value) =>
            typeof value === 'number' ? `${value}%` : `${value[0]}–${value[1]}%`,
        getThumbLabel: (index) =>
            index === 0 ? 'Минимальная уверенность' : 'Максимальная уверенность',
        label: 'Диапазон уверенности',
        step: 5,
    },
}

export const Validation: Story = {
    args: {
        defaultValue: 20,
        description: 'Для запуска в продакшен требуется уверенность не менее 50%.',
        formatValue: (value) => `${value}%`,
        label: 'Уверенность в запуске',
        validate: (value) =>
            typeof value === 'number' && value >= 50
                ? undefined
                : 'Установите уверенность в запуске не ниже 50%',
    },
}

export const WithoutValue: Story = {
    args: {
        defaultValue: 40,
        label: 'Громкость',
        showValue: false,
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: 75,
        disabled: true,
        formatValue: (value) => `${value}%`,
        label: 'Зафиксированная уверенность',
    },
}
