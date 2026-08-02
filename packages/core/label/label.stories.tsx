import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Checkbox } from '../checkbox'
import { Input } from '../input'
import { Label } from './label'

const meta: Meta<typeof Label> = {
    component: Label,
    title: 'core/Label',
}

export default meta

type Story = StoryObj<typeof Label>

export const Default: Story = {
    args: {
        children: 'Текст подписи',
    },
}

export const WithInput: Story = {
    render: () => (
        <div className="grid gap-2">
            <Label htmlFor="email">Электронная почта</Label>
            <Input id="email" type="email" placeholder="email@example.com" />
        </div>
    ),
}

export const WithCheckbox: Story = {
    render: () => (
        <div className="flex items-center gap-2">
            <Checkbox id="terms" />
            <Label htmlFor="terms">Принять условия использования</Label>
        </div>
    ),
}

export const Required: Story = {
    render: () => (
        <div className="grid gap-2">
            <Label htmlFor="required-field">
                Обязательное поле
                <span className="text-destructive">*</span>
            </Label>
            <Input id="required-field" required />
        </div>
    ),
}

export const Disabled: Story = {
    render: () => (
        <div className="grid gap-2" data-disabled="true">
            <Label htmlFor="disabled-field">Недоступное поле</Label>
            <Input id="disabled-field" disabled />
        </div>
    ),
}

export const WithDescription: Story = {
    render: () => (
        <div className="grid gap-2">
            <Label htmlFor="username">Имя пользователя</Label>
            <Input id="username" placeholder="@username" />
            <p className="text-sm text-muted-foreground">Это имя будет отображаться публично.</p>
        </div>
    ),
}
