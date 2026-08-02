import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Field } from '@base-ui/react/field'
import { CircleIcon, SquareIcon, TriangleIcon } from 'lucide-react'

import { Label } from '../label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

const meta: Meta<typeof Select> = {
    component: Select,
    title: 'core/Select',
}

export default meta

type Story = StoryObj<typeof Select>

const neutralOptions = [
    { label: 'Первый вариант', value: 'first' },
    { label: 'Второй вариант', value: 'second' },
    { label: 'Третий вариант', value: 'third' },
] as const

function NeutralOptions() {
    return neutralOptions.map(({ label, value }) => (
        <SelectItem key={value} value={value}>
            {label}
        </SelectItem>
    ))
}

export const Default: Story = {
    render: () => (
        <Select items={neutralOptions}>
            <SelectTrigger className="w-48">
                <SelectValue placeholder="Выберите вариант" />
            </SelectTrigger>
            <SelectContent>
                <NeutralOptions />
            </SelectContent>
        </Select>
    ),
}

export const Small: Story = {
    render: () => (
        <Select defaultValue="second" items={neutralOptions}>
            <SelectTrigger size="sm" className="w-32">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <NeutralOptions />
            </SelectContent>
        </Select>
    ),
}

export const WithLabel: Story = {
    render: () => (
        <Field.Root className="grid gap-2">
            <Field.Label render={<Label />} htmlFor="option">
                Вариант
            </Field.Label>
            <Select items={neutralOptions}>
                <SelectTrigger id="option" className="w-56">
                    <SelectValue placeholder="Выберите вариант" />
                </SelectTrigger>
                <SelectContent>
                    <NeutralOptions />
                </SelectContent>
            </Select>
        </Field.Root>
    ),
}

export const Disabled: Story = {
    render: () => (
        <Select disabled defaultValue="second" items={neutralOptions}>
            <SelectTrigger className="w-48">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <NeutralOptions />
            </SelectContent>
        </Select>
    ),
}

export const DisabledItem: Story = {
    render: () => (
        <Select>
            <SelectTrigger className="w-48">
                <SelectValue placeholder="Выберите вариант" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="first">Первый вариант</SelectItem>
                <SelectItem value="second">Второй вариант</SelectItem>
                <SelectItem value="third" disabled>
                    Недоступный вариант
                </SelectItem>
            </SelectContent>
        </Select>
    ),
}

export const WithIcons: Story = {
    render: () => (
        <Select defaultValue="circle">
            <SelectTrigger className="w-48">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="circle">
                    <CircleIcon className="size-4" />
                    Круг
                </SelectItem>
                <SelectItem value="square">
                    <SquareIcon className="size-4" />
                    Квадрат
                </SelectItem>
                <SelectItem value="triangle">
                    <TriangleIcon className="size-4" />
                    Треугольник
                </SelectItem>
            </SelectContent>
        </Select>
    ),
}
