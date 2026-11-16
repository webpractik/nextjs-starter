import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '../button'
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from './card'

const meta = {
    component: Card,
    title: 'core/Card',
    argTypes: {
        size: {
            control: 'select',
            options: ['default', 'sm'],
        },
    },
} satisfies Meta<typeof Card>

export default meta

type Story = StoryObj<typeof Card>

export const Default: Story = {
    render: (args) => (
        <Card {...args}>
            <CardHeader>
                <CardTitle>Заголовок карточки</CardTitle>
                <CardDescription>Здесь находится описание карточки</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Содержимое карточки с небольшим текстом.</p>
            </CardContent>
            <CardFooter>
                <Button>Действие</Button>
            </CardFooter>
        </Card>
    ),
    args: {
        size: 'default',
    },
}

export const Small: Story = {
    render: (args) => (
        <Card {...args}>
            <CardHeader>
                <CardTitle>Маленькая карточка</CardTitle>
                <CardDescription>Компактный вариант</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Содержимое маленькой карточки.</p>
            </CardContent>
        </Card>
    ),
    args: {
        size: 'sm',
    },
}

export const WithAction: Story = {
    render: () => (
        <Card className="w-96">
            <CardHeader>
                <CardTitle>Карточка с действием</CardTitle>
                <CardDescription>В заголовке этой карточки есть кнопка действия</CardDescription>
                <CardAction>
                    <Button variant="outline" size="sm">
                        Изменить
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <p>Здесь находится содержимое.</p>
            </CardContent>
        </Card>
    ),
}

export const Simple: Story = {
    render: () => (
        <Card className="w-64">
            <CardContent>
                <p className="text-2xl font-bold">1 234 ₽</p>
                <p className="text-muted-foreground">Общая выручка</p>
            </CardContent>
        </Card>
    ),
}

export const WithFooterActions: Story = {
    render: () => (
        <Card className="w-96">
            <CardHeader>
                <CardTitle>Подтверждение действия</CardTitle>
                <CardDescription>Продолжить выполнение?</CardDescription>
            </CardHeader>
            <CardContent>
                <p>Это действие нельзя отменить.</p>
            </CardContent>
            <CardFooter className="gap-2">
                <Button variant="outline">Отмена</Button>
                <Button>Подтвердить</Button>
            </CardFooter>
        </Card>
    ),
}
