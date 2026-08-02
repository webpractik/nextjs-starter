import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { MailIcon, PlusIcon } from 'lucide-react'

import { Button } from './button'

const meta: Meta<typeof Button> = {
    component: Button,
    title: 'core/Button',
    argTypes: {
        variant: {
            control: 'select',
            options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'],
        },
        size: {
            control: 'select',
            options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'],
        },
        disabled: {
            control: 'boolean',
        },
    },
}

export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = {
    args: {
        children: 'Кнопка',
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
        children: 'Опасное действие',
        variant: 'destructive',
    },
}

export const Link: Story = {
    args: {
        children: 'Ссылка',
        variant: 'link',
    },
}

export const Small: Story = {
    args: {
        children: 'Маленькая',
        size: 'sm',
    },
}

export const ExtraSmall: Story = {
    args: {
        children: 'Очень маленькая',
        size: 'xs',
    },
}

export const Large: Story = {
    args: {
        children: 'Большая',
        size: 'lg',
    },
}

export const Icon: Story = {
    args: {
        children: <PlusIcon />,
        size: 'icon',
        'aria-label': 'Добавить',
    },
}

export const IconSmall: Story = {
    args: {
        children: <PlusIcon />,
        size: 'icon-sm',
        'aria-label': 'Добавить',
    },
}

export const WithIcon: Story = {
    args: {
        children: (
            <>
                <MailIcon data-icon="inline-start" />
                Отправить письмо
            </>
        ),
    },
}

export const Disabled: Story = {
    args: {
        children: 'Недоступна',
        disabled: true,
    },
}

export const AllVariants: Story = {
    render: () => (
        <div className="flex flex-wrap gap-4">
            <Button variant="default">Обычная</Button>
            <Button variant="outline">Контурная</Button>
            <Button variant="secondary">Вторичная</Button>
            <Button variant="ghost">Прозрачная</Button>
            <Button variant="destructive">Опасное действие</Button>
            <Button variant="link">Ссылка</Button>
        </div>
    ),
}

export const AllSizes: Story = {
    render: () => (
        <div className="flex flex-wrap items-center gap-4">
            <Button size="xs">Очень маленькая</Button>
            <Button size="sm">Маленькая</Button>
            <Button size="default">Обычная</Button>
            <Button size="lg">Большая</Button>
        </div>
    ),
}
