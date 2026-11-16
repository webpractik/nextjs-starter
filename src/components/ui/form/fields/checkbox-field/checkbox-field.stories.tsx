import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import type { ReactNode } from 'react'

import { CheckboxField } from '.'
import { FieldStory } from '../shared/field-story'

interface CheckboxFieldStoryProps {
    defaultValue?: boolean
    description?: ReactNode
    disabled?: boolean
    label: ReactNode
    validate?: (_value: unknown) => string | undefined
}

function CheckboxFieldStory({
    defaultValue = false,
    description,
    disabled,
    label,
    validate,
}: CheckboxFieldStoryProps) {
    return (
        <FieldStory defaultValue={defaultValue} validate={validate}>
            <CheckboxField description={description} disabled={disabled} label={label} />
        </FieldStory>
    )
}

const meta = {
    component: CheckboxFieldStory,
    title: 'core/Form/CheckboxField',
} satisfies Meta<typeof CheckboxFieldStory>

export default meta

type Story = StoryObj<typeof CheckboxFieldStory>

export const Default: Story = {
    args: {
        description: 'Обязательно для создания рабочего пространства.',
        label: 'Я принимаю условия использования',
    },
}

export const Checked: Story = {
    args: {
        defaultValue: true,
        label: 'Присылать мне новости продукта',
    },
}

export const Validation: Story = {
    args: {
        description: 'Для продолжения необходимо принять условия.',
        label: 'Я принимаю условия использования',
        validate: (value) =>
            value === true ? undefined : 'Примите условия использования, чтобы продолжить',
    },
}

export const Disabled: Story = {
    args: {
        defaultValue: true,
        disabled: true,
        description: 'Этой настройкой управляет ваша организация.',
        label: 'Требовать единый вход',
    },
}
