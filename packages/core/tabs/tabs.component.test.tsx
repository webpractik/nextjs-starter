import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '.'

function TabsDemo() {
    return (
        <Tabs defaultValue="profile">
            <TabsList aria-label="Настройки">
                <TabsTrigger value="profile">Профиль</TabsTrigger>
                <TabsTrigger disabled value="security">
                    Безопасность
                </TabsTrigger>
                <TabsTrigger value="notifications">Уведомления</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">Настройки профиля</TabsContent>
            <TabsContent value="security">Настройки безопасности</TabsContent>
            <TabsContent value="notifications">Настройки уведомлений</TabsContent>
        </Tabs>
    )
}

it('по нажатию выбирает вкладку и показывает только связанную с ней панель', async () => {
    const screen = await render(<TabsDemo />)
    const notifications = screen.getByRole('tab', { name: 'Уведомления' })

    await notifications.click()

    await expect.element(notifications).toHaveAttribute('aria-selected', 'true')
    await expect.element(screen.getByRole('tabpanel')).toHaveTextContent('Настройки уведомлений')
    await expect.element(screen.getByText('Настройки профиля')).not.toBeInTheDocument()
})

it('стрелками перемещает фокус без активации, а Enter выбирает доступную вкладку', async () => {
    const screen = await render(<TabsDemo />)
    const profile = screen.getByRole('tab', { name: 'Профиль' })
    const security = screen.getByRole('tab', { name: 'Безопасность' })
    const notifications = screen.getByRole('tab', { name: 'Уведомления' })

    profile.element().focus()
    await userEvent.keyboard('{ArrowRight}')

    await expect.poll(() => document.activeElement).toBe(security.element())
    await expect.element(security).toHaveAttribute('aria-selected', 'false')
    await expect.element(screen.getByRole('tabpanel')).toHaveTextContent('Настройки профиля')

    await userEvent.keyboard('{ArrowRight}')

    await expect.poll(() => document.activeElement).toBe(notifications.element())
    await expect.element(notifications).toHaveAttribute('aria-selected', 'false')
    await expect.element(screen.getByRole('tabpanel')).toHaveTextContent('Настройки профиля')

    await userEvent.keyboard('{Enter}')

    await expect.element(notifications).toHaveAttribute('aria-selected', 'true')
    await expect.element(screen.getByRole('tabpanel')).toHaveTextContent('Настройки уведомлений')
})
