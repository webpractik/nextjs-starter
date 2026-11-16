import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '../button'
import { Toaster } from './toast'
import { toast } from './toast-manager'

const meta = {
    component: Toaster,
    decorators: [
        (Story) => (
            <>
                <Story />
                <Toaster />
            </>
        ),
    ],
    title: 'core/Toast',
} satisfies Meta<typeof Toaster>

export default meta

type Story = StoryObj<typeof Toaster>

export const Default: Story = {
    render: () => (
        <Button
            onClick={() => {
                toast.add({ title: 'Рабочее пространство сохранено' })
            }}
        >
            Показать уведомление
        </Button>
    ),
}

export const Statuses: Story = {
    render: () => (
        <div className="flex flex-wrap gap-2">
            <Button
                onClick={() => {
                    toast.add({ title: 'Изменения сохранены', type: 'success' })
                }}
            >
                Успех
            </Button>
            <Button
                onClick={() => {
                    toast.add({ title: 'Доступна новая версия', type: 'info' })
                }}
            >
                Информация
            </Button>
            <Button
                variant="outline"
                onClick={() => {
                    toast.add({ title: 'Проверьте импортированные значения', type: 'warning' })
                }}
            >
                Предупреждение
            </Button>
            <Button
                variant="destructive"
                onClick={() => {
                    toast.add({ title: 'Не удалось сохранить изменения', type: 'error' })
                }}
            >
                Ошибка
            </Button>
            <Button
                onClick={() => {
                    toast.add({ title: 'Отчёт загружается', type: 'loading' })
                }}
            >
                Загрузка
            </Button>
        </div>
    ),
}

export const WithDescription: Story = {
    render: () => (
        <Button
            onClick={() => {
                toast.add({
                    description: 'Проверка назначена на понедельник, 10:00.',
                    title: 'Событие создано',
                })
            }}
        >
            Показать подробности
        </Button>
    ),
}

export const WithAction: Story = {
    render: () => (
        <Button
            variant="outline"
            onClick={() => {
                toast.add({
                    actionProps: {
                        children: 'Отменить',
                        onClick: () => {
                            toast.add({ title: 'Файл восстановлен', type: 'success' })
                        },
                    },
                    description: 'квартальный-отчёт.pdf',
                    title: 'Файл удалён',
                })
            }}
        >
            Удалить файл
        </Button>
    ),
}

export const PromiseLifecycle: Story = {
    render: () => (
        <Button
            onClick={() => {
                const upload = new Promise<string>((resolve) => {
                    setTimeout(resolve, 1500, 'квартальный-отчёт.pdf')
                })

                void toast.promise(upload, {
                    error: 'Не удалось загрузить файл',
                    loading: 'Отчёт загружается',
                    success: (filename) => `Файл ${filename} загружен`,
                })
            }}
        >
            Загрузить отчёт
        </Button>
    ),
}

export const Persistent: Story = {
    render: () => (
        <Button
            onClick={() => {
                toast.add({
                    description: 'Закройте это уведомление вручную.',
                    timeout: 0,
                    title: 'Постоянное уведомление',
                })
            }}
        >
            Показать постоянное уведомление
        </Button>
    ),
}

export const Stacking: Story = {
    render: () => (
        <Button
            onClick={() => {
                toast.add({ title: 'Профиль обновлён', type: 'success' })
                toast.add({ title: 'Команда приглашена', type: 'info' })
                toast.add({ title: 'Отчёт добавлен в очередь', type: 'loading' })
            }}
        >
            Показать несколько уведомлений
        </Button>
    ),
}
