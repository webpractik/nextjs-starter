import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { BellIcon, SettingsIcon, UserIcon } from 'lucide-react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs'

const meta: Meta<typeof Tabs> = {
    component: Tabs,
    title: 'core/Tabs',
    argTypes: {
        orientation: {
            control: 'select',
            options: ['horizontal', 'vertical'],
        },
    },
}

export default meta

type Story = StoryObj<typeof Tabs>

export const Default: Story = {
    render: () => (
        <Tabs defaultValue="account">
            <TabsList>
                <TabsTrigger value="account">Аккаунт</TabsTrigger>
                <TabsTrigger value="password">Пароль</TabsTrigger>
                <TabsTrigger value="settings">Настройки</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
                <p className="text-muted-foreground">
                    Управляйте настройками и параметрами аккаунта.
                </p>
            </TabsContent>
            <TabsContent value="password">
                <p className="text-muted-foreground">Измените пароль и настройки безопасности.</p>
            </TabsContent>
            <TabsContent value="settings">
                <p className="text-muted-foreground">Настройте приложение.</p>
            </TabsContent>
        </Tabs>
    ),
}

export const LineVariant: Story = {
    render: () => (
        <Tabs defaultValue="overview">
            <TabsList variant="line">
                <TabsTrigger value="overview">Обзор</TabsTrigger>
                <TabsTrigger value="analytics">Аналитика</TabsTrigger>
                <TabsTrigger value="reports">Отчёты</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
                <p className="text-muted-foreground">Здесь находится содержимое обзора.</p>
            </TabsContent>
            <TabsContent value="analytics">
                <p className="text-muted-foreground">Здесь находится содержимое аналитики.</p>
            </TabsContent>
            <TabsContent value="reports">
                <p className="text-muted-foreground">Здесь находится содержимое отчётов.</p>
            </TabsContent>
        </Tabs>
    ),
}

export const Vertical: Story = {
    render: () => (
        <Tabs defaultValue="profile" orientation="vertical">
            <TabsList>
                <TabsTrigger value="profile">Профиль</TabsTrigger>
                <TabsTrigger value="account">Аккаунт</TabsTrigger>
                <TabsTrigger value="security">Безопасность</TabsTrigger>
                <TabsTrigger value="notifications">Уведомления</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="px-4">
                <h3 className="font-semibold">Настройки профиля</h3>
                <p className="text-muted-foreground">Управляйте данными профиля.</p>
            </TabsContent>
            <TabsContent value="account" className="px-4">
                <h3 className="font-semibold">Настройки аккаунта</h3>
                <p className="text-muted-foreground">Управляйте настройками аккаунта.</p>
            </TabsContent>
            <TabsContent value="security" className="px-4">
                <h3 className="font-semibold">Настройки безопасности</h3>
                <p className="text-muted-foreground">Управляйте параметрами безопасности.</p>
            </TabsContent>
            <TabsContent value="notifications" className="px-4">
                <h3 className="font-semibold">Настройки уведомлений</h3>
                <p className="text-muted-foreground">Управляйте параметрами уведомлений.</p>
            </TabsContent>
        </Tabs>
    ),
}

export const VerticalLine: Story = {
    render: () => (
        <Tabs defaultValue="general" orientation="vertical">
            <TabsList variant="line">
                <TabsTrigger value="general">Общие</TabsTrigger>
                <TabsTrigger value="appearance">Оформление</TabsTrigger>
                <TabsTrigger value="advanced">Дополнительно</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="px-4">
                <p className="text-muted-foreground">Содержимое общих настроек.</p>
            </TabsContent>
            <TabsContent value="appearance" className="px-4">
                <p className="text-muted-foreground">Содержимое настроек оформления.</p>
            </TabsContent>
            <TabsContent value="advanced" className="px-4">
                <p className="text-muted-foreground">Содержимое дополнительных настроек.</p>
            </TabsContent>
        </Tabs>
    ),
}

export const WithIcons: Story = {
    render: () => (
        <Tabs defaultValue="profile">
            <TabsList>
                <TabsTrigger value="profile">
                    <UserIcon />
                    Профиль
                </TabsTrigger>
                <TabsTrigger value="notifications">
                    <BellIcon />
                    Уведомления
                </TabsTrigger>
                <TabsTrigger value="settings">
                    <SettingsIcon />
                    Настройки
                </TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
                <p className="text-muted-foreground">Содержимое профиля.</p>
            </TabsContent>
            <TabsContent value="notifications">
                <p className="text-muted-foreground">Содержимое уведомлений.</p>
            </TabsContent>
            <TabsContent value="settings">
                <p className="text-muted-foreground">Содержимое настроек.</p>
            </TabsContent>
        </Tabs>
    ),
}

export const Disabled: Story = {
    render: () => (
        <Tabs defaultValue="active">
            <TabsList>
                <TabsTrigger value="active">Активная вкладка</TabsTrigger>
                <TabsTrigger value="disabled" disabled>
                    Недоступная вкладка
                </TabsTrigger>
                <TabsTrigger value="another">Другая вкладка</TabsTrigger>
            </TabsList>
            <TabsContent value="active">
                <p className="text-muted-foreground">Содержимое активной вкладки.</p>
            </TabsContent>
            <TabsContent value="another">
                <p className="text-muted-foreground">Содержимое другой вкладки.</p>
            </TabsContent>
        </Tabs>
    ),
}

export const WithRichContent: Story = {
    render: () => (
        <Tabs defaultValue="details" className="w-full max-w-lg">
            <TabsList>
                <TabsTrigger value="details">Описание</TabsTrigger>
                <TabsTrigger value="specs">Характеристики</TabsTrigger>
                <TabsTrigger value="reviews">Отзывы</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="space-y-4">
                <h3 className="font-semibold">Описание товара</h3>
                <p className="text-muted-foreground">
                    Подробная информация о товаре, его назначении и основных особенностях.
                </p>
            </TabsContent>
            <TabsContent value="specs" className="space-y-4">
                <h3 className="font-semibold">Технические характеристики</h3>
                <ul className="space-y-2 text-muted-foreground">
                    <li>Вес: 1,5 кг</li>
                    <li>Размеры: 30 × 20 × 10 см</li>
                    <li>Материал: алюминий</li>
                    <li>Цвет: космический серый</li>
                </ul>
            </TabsContent>
            <TabsContent value="reviews" className="space-y-4">
                <h3 className="font-semibold">Отзывы покупателей</h3>
                <p className="text-muted-foreground">Оценка 4,5 из 5 на основе 128 отзывов.</p>
            </TabsContent>
        </Tabs>
    ),
}
