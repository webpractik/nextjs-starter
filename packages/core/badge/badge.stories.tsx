import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { CheckIcon, XIcon } from 'lucide-react'

import { Badge } from './badge'

const meta = {
    component: Badge,
    title: 'core/Badge',
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
        },
    },
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof Badge>

export const Default: Story = {
    args: {
        children: 'Метка',
        variant: 'default',
    },
}

export const Outline: Story = {
    args: {
        children: 'Контурная',
        variant: 'outline',
    },
}

export const Secondary: Story = {
    args: {
        children: 'Вторичная',
        variant: 'secondary',
    },
}

export const Ghost: Story = {
    args: {
        children: 'Прозрачная',
        variant: 'ghost',
    },
}

export const Destructive: Story = {
    args: {
        children: 'Опасная',
        variant: 'destructive',
    },
}

export const Link: Story = {
    args: {
        children: 'Ссылка',
        variant: 'link',
    },
}

export const WithIcon: Story = {
    args: {
        children: (
            <>
                <CheckIcon data-icon="inline-start" />
                Подтверждено
            </>
        ),
        variant: 'default',
    },
}

export const WithIconEnd: Story = {
    args: {
        children: (
            <>
                Закрыть
                <XIcon data-icon="inline-end" />
            </>
        ),
        variant: 'secondary',
    },
}

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-wrap gap-2">
            <Badge variant="default">Обычная</Badge>
            <Badge variant="outline">Контурная</Badge>
            <Badge variant="secondary">Вторичная</Badge>
            <Badge variant="ghost">Прозрачная</Badge>
            <Badge variant="destructive">Опасная</Badge>
            <Badge variant="link">Ссылка</Badge>
        </div>
    ),
}
