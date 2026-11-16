import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '.'
import { Button } from '../button'

function DialogDemo() {
    return (
        <Dialog>
            <DialogTrigger render={<Button />}>Редактировать профиль</DialogTrigger>
            <DialogContent>
                <DialogTitle>Редактирование профиля</DialogTitle>
                <DialogDescription>Измените отображаемое имя.</DialogDescription>
                <label htmlFor="profile-name">Имя</label>
                <input id="profile-name" />
            </DialogContent>
        </Dialog>
    )
}

it('открывает диалог с доступными заголовком и описанием и закрывает его штатной кнопкой', async () => {
    const screen = await render(<DialogDemo />)

    await screen.getByRole('button', { name: 'Редактировать профиль' }).click()

    const dialog = screen.getByRole('dialog', { name: 'Редактирование профиля' })
    await expect.element(dialog).toBeVisible()
    await expect.element(dialog).toHaveAccessibleDescription('Измените отображаемое имя.')

    await screen.getByRole('button', { name: 'Close' }).click()
    await expect.element(dialog).not.toBeInTheDocument()
})

it('переводит фокус внутрь открытого диалога и возвращает его на кнопку после Escape', async () => {
    const screen = await render(<DialogDemo />)
    const trigger = screen.getByRole('button', { name: 'Редактировать профиль' })

    await trigger.click()
    const nameField = screen.getByRole('textbox', { name: 'Имя' })
    await expect.poll(() => document.activeElement).toBe(nameField.element())

    await userEvent.keyboard('{Escape}')

    await expect
        .element(screen.getByRole('dialog', { name: 'Редактирование профиля' }))
        .not.toBeInTheDocument()
    await expect.poll(() => document.activeElement).toBe(trigger.element())
})
