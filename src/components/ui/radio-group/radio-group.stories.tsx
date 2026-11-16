import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Label } from '../label'
import { RadioGroup, RadioGroupItem } from './radio-group'

const meta = {
    component: RadioGroup,
    title: 'core/RadioGroup',
} satisfies Meta<typeof RadioGroup>

export default meta

type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
    render: () => (
        <RadioGroup defaultValue="option-1">
            <div className="flex items-center gap-2">
                <RadioGroupItem value="option-1" id="option-1" />
                <Label htmlFor="option-1">Вариант 1</Label>
            </div>
            <div className="flex items-center gap-2">
                <RadioGroupItem value="option-2" id="option-2" />
                <Label htmlFor="option-2">Вариант 2</Label>
            </div>
            <div className="flex items-center gap-2">
                <RadioGroupItem value="option-3" id="option-3" />
                <Label htmlFor="option-3">Вариант 3</Label>
            </div>
        </RadioGroup>
    ),
}

export const NoDefault: Story = {
    render: () => (
        <RadioGroup>
            <div className="flex items-center gap-2">
                <RadioGroupItem value="a" id="a" />
                <Label htmlFor="a">Вариант А</Label>
            </div>
            <div className="flex items-center gap-2">
                <RadioGroupItem value="b" id="b" />
                <Label htmlFor="b">Вариант Б</Label>
            </div>
        </RadioGroup>
    ),
}

export const Disabled: Story = {
    render: () => (
        <RadioGroup defaultValue="enabled">
            <div className="flex items-center gap-2">
                <RadioGroupItem value="enabled" id="enabled" />
                <Label htmlFor="enabled">Доступный вариант</Label>
            </div>
            <div className="flex items-center gap-2">
                <RadioGroupItem value="disabled" id="disabled" disabled />
                <Label htmlFor="disabled" className="opacity-50">
                    Недоступный вариант
                </Label>
            </div>
        </RadioGroup>
    ),
}

export const Invalid: Story = {
    render: () => (
        <RadioGroup aria-invalid>
            <div className="flex items-center gap-2">
                <RadioGroupItem value="yes" id="yes" aria-invalid />
                <Label htmlFor="yes">Да</Label>
            </div>
            <div className="flex items-center gap-2">
                <RadioGroupItem value="no" id="no" aria-invalid />
                <Label htmlFor="no">Нет</Label>
            </div>
        </RadioGroup>
    ),
}

export const WithDescriptions: Story = {
    render: () => (
        <RadioGroup defaultValue="personal" className="gap-4">
            <div className="flex gap-2">
                <RadioGroupItem value="personal" id="personal" className="mt-1" />
                <div className="grid gap-1">
                    <Label htmlFor="personal">Личное</Label>
                    <p className="text-sm text-muted-foreground">Для личных проектов</p>
                </div>
            </div>
            <div className="flex gap-2">
                <RadioGroupItem value="team" id="team" className="mt-1" />
                <div className="grid gap-1">
                    <Label htmlFor="team">Командное</Label>
                    <p className="text-sm text-muted-foreground">
                        Для совместной работы с командой
                    </p>
                </div>
            </div>
            <div className="flex gap-2">
                <RadioGroupItem value="enterprise" id="enterprise" className="mt-1" />
                <div className="grid gap-1">
                    <Label htmlFor="enterprise">Корпоративное</Label>
                    <p className="text-sm text-muted-foreground">Для крупных организаций</p>
                </div>
            </div>
        </RadioGroup>
    ),
}

export const Horizontal: Story = {
    render: () => (
        <RadioGroup defaultValue="left" className="flex flex-row gap-4">
            <div className="flex items-center gap-2">
                <RadioGroupItem value="left" id="left" />
                <Label htmlFor="left">Слева</Label>
            </div>
            <div className="flex items-center gap-2">
                <RadioGroupItem value="center" id="center" />
                <Label htmlFor="center">По центру</Label>
            </div>
            <div className="flex items-center gap-2">
                <RadioGroupItem value="right" id="right" />
                <Label htmlFor="right">Справа</Label>
            </div>
        </RadioGroup>
    ),
}
