import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '#/components/ui/card'

it('сохраняет заголовок, описание, содержимое и действия карточки', async () => {
    const screen = await render(
        <Card role="region" aria-labelledby="card-title" size="sm">
            <CardHeader>
                <CardTitle id="card-title">Проект</CardTitle>
                <CardDescription>Рабочее пространство</CardDescription>
                <CardAction>
                    <button type="button">Настроить</button>
                </CardAction>
            </CardHeader>
            <CardContent>Три участника</CardContent>
            <CardFooter>Обновлено сегодня</CardFooter>
        </Card>,
    )
    const card = screen.getByRole('region', { name: 'Проект' })
    await expect.element(card).toHaveAttribute('data-size', 'sm')
    await expect.element(card).toMatchTextContent('Рабочее пространство')
    await expect.element(card).toMatchTextContent('Три участника')
    await expect.element(card).toMatchTextContent('Обновлено сегодня')
    await expect.element(screen.getByRole('button', { name: 'Настроить' })).toBeEnabled()
})
