import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Label } from '../label'
import { Textarea } from './textarea'

const meta = {
    component: Textarea,
    title: 'core/Textarea',
    argTypes: {
        disabled: {
            control: 'boolean',
        },
        placeholder: {
            control: 'text',
        },
        rows: {
            control: { type: 'number', min: 1, max: 20 },
        },
    },
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof Textarea>

export const Default: Story = {
    args: {
        placeholder: 'Введите сообщение…',
    },
}

export const WithValue: Story = {
    args: {
        defaultValue:
            'Это пример заранее заполненного многострочного поля с текстом на русском языке.',
    },
}

export const Disabled: Story = {
    args: {
        placeholder: 'Недоступное текстовое поле',
        disabled: true,
    },
}

export const Invalid: Story = {
    args: {
        placeholder: 'Текстовое поле с ошибкой',
        'aria-invalid': true,
        defaultValue: 'Некорректное содержимое',
    },
}

export const WithLabel: Story = {
    render: () => (
        <div className="grid gap-2">
            <Label htmlFor="message">Сообщение</Label>
            <Textarea id="message" placeholder="Введите сообщение…" />
        </div>
    ),
}

export const WithDescription: Story = {
    render: () => (
        <div className="grid gap-2">
            <Label htmlFor="bio">О себе</Label>
            <Textarea id="bio" placeholder="Немного расскажите о себе" />
            <p className="text-sm text-muted-foreground">Можно ввести до 500 символов.</p>
        </div>
    ),
}

export const WithMaxLength: Story = {
    render: () => (
        <div className="grid gap-2">
            <Label htmlFor="limited">Поле с ограничением</Label>
            <Textarea id="limited" placeholder="Не более 100 символов" maxLength={100} />
            <p className="text-sm text-muted-foreground">Не более 100 символов.</p>
        </div>
    ),
}

export const Required: Story = {
    render: () => (
        <div className="grid gap-2">
            <Label htmlFor="required-textarea">
                Описание
                <span className="text-destructive">*</span>
            </Label>
            <Textarea id="required-textarea" placeholder="Это поле обязательно" required />
        </div>
    ),
}

export const ReadOnly: Story = {
    args: {
        defaultValue: 'Это содержимое доступно только для чтения.',
        readOnly: true,
    },
}

export const CustomSize: Story = {
    render: () => (
        <div className="space-y-4">
            <div className="grid gap-2">
                <Label>Маленькое (2 строки)</Label>
                <Textarea placeholder="Маленькое текстовое поле" rows={2} />
            </div>
            <div className="grid gap-2">
                <Label>Большое (8 строк)</Label>
                <Textarea placeholder="Большое текстовое поле" rows={8} />
            </div>
        </div>
    ),
}
