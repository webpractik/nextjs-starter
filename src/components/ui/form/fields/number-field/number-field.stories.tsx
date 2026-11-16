import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import type { NumberFieldProps } from '.'

import { NumberField } from '.'
import { FieldStory } from '../shared/field-story'

interface NumberFieldStoryProps {
    defaultValue?: unknown
    description?: ReactNode
    disabled?: boolean
    emptyValue?: unknown
    format?: NumberFieldProps['format']
    label: ReactNode
    min?: NumberFieldProps['min']
    parse?: NumberFieldProps['parse']
    step?: NumberFieldProps['step']
    validate?: (_value: unknown) => string | undefined
}

function NumberFieldStory({
    defaultValue = 1,
    description,
    disabled,
    emptyValue,
    format,
    label,
    min,
    parse,
    step,
    validate,
}: NumberFieldStoryProps) {
    return (
        <FieldStory defaultValue={defaultValue} validate={validate}>
            <NumberField
                description={description}
                disabled={disabled}
                emptyValue={emptyValue}
                format={format}
                label={label}
                min={min}
                parse={parse}
                step={step}
            />
        </FieldStory>
    )
}

const meta = {
    component: NumberFieldStory,
    title: 'core/Form/NumberField',
} satisfies Meta<typeof NumberFieldStory>

export default meta

type Story = StoryObj<typeof NumberFieldStory>

export const Default: Story = {
    args: {
        defaultValue: 3,
        description: 'Количество участников рабочего пространства.',
        label: 'Количество мест',
        min: 1,
    },
}

export const ParsedValue: Story = {
    args: {
        defaultValue: 12_500,
        description: 'В форме значение хранится в копейках, а поле показывает рубли.',
        format: (value) => (typeof value === 'number' ? String(value / 100) : ''),
        label: 'Месячный бюджет, ₽',
        min: 0,
        parse: (value) => Number(value) * 100,
        step: '0.01',
    },
}

export const Validation: Story = {
    args: {
        defaultValue: 0,
        description: 'Необходимо выбрать хотя бы одно место.',
        label: 'Количество мест',
        min: 0,
        validate: (value) =>
            typeof value === 'number' && value >= 1 ? undefined : 'Выберите хотя бы одно место',
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: 12,
        disabled: true,
        label: 'Лицензионные места',
    },
}
