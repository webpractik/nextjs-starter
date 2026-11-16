import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Button } from '../button'
import { Input } from '../input'
import { Label } from '../label'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from './dialog'

const meta = {
    component: Dialog,
    title: 'core/Dialog',
} satisfies Meta<typeof Dialog>

export default meta

type Story = StoryObj<typeof Dialog>

const longContentParagraphKeys = Array.from({ length: 10 }, (_, index) => `paragraph-${index + 1}`)

export const Default: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger render={<Button />}>Открыть диалог</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Заголовок диалога</DialogTitle>
                    <DialogDescription>
                        Это описание диалога. Здесь можно разместить дополнительные сведения о его
                        содержимом.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <p>Здесь находится содержимое диалога.</p>
                </div>
                <DialogFooter>
                    <Button>Сохранить</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

export const WithForm: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger render={<Button />}>Редактировать профиль</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Редактирование профиля</DialogTitle>
                    <DialogDescription>
                        Измените данные профиля. Когда закончите, нажмите «Сохранить».
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Имя</Label>
                        <Input id="name" defaultValue="Павел Дуров" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="username">Имя пользователя</Label>
                        <Input id="username" defaultValue="@durov" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline">Отмена</Button>
                    <Button>Сохранить изменения</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

export const Confirmation: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger render={<Button variant="destructive" />}>Удалить аккаунт</DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Вы уверены?</DialogTitle>
                    <DialogDescription>
                        Это действие нельзя отменить. Аккаунт и все ваши данные будут безвозвратно
                        удалены с наших серверов.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline">Отмена</Button>
                    <Button variant="destructive">Удалить</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

export const WithoutCloseButton: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger render={<Button />}>Открыть диалог</DialogTrigger>
            <DialogContent className="sm:max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>Без кнопки закрытия</DialogTitle>
                    <DialogDescription>
                        У этого диалога нет кнопки закрытия в углу.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter showCloseButton>
                    <Button>Подтвердить</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}

export const LongContent: Story = {
    render: () => (
        <Dialog>
            <DialogTrigger render={<Button />}>Открыть длинный диалог</DialogTrigger>
            <DialogContent className={`
                max-h-[80vh] overflow-y-auto
                sm:max-w-lg
            `}>
                <DialogHeader>
                    <DialogTitle>Условия использования</DialogTitle>
                    <DialogDescription>Прочитайте и примите наши условия.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {longContentParagraphKeys.map((paragraphKey) => (
                        <p key={paragraphKey}>
                            Это пример длинного текста в прокручиваемом диалоге. Он помогает
                            проверить расположение заголовка, содержимого и кнопок при большом
                            объёме информации.
                        </p>
                    ))}
                </div>
                <DialogFooter>
                    <Button variant="outline">Отклонить</Button>
                    <Button>Принять</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ),
}
