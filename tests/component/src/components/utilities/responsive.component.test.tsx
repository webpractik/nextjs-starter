import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

import { Desktop, Laptop, Mobile, Tablet } from '#/components/utilities/responsive'

it('обновляет видимые диапазоны при изменении ширины окна', async () => {
    const previousWidth = window.innerWidth
    const previousHeight = window.innerHeight

    try {
        await page.viewport(375, 800)
        const screen = await render(
            <>
                <Mobile>
                    <span>Мобильный</span>
                </Mobile>
                <Tablet>
                    <span>Планшет</span>
                </Tablet>
                <Laptop>
                    <span>Ноутбук</span>
                </Laptop>
                <Desktop>
                    <span>Компьютер</span>
                </Desktop>
            </>,
        )
        await expect.element(screen.getByText('Мобильный', { exact: true })).toBeVisible()
        await expect.element(screen.getByText('Планшет', { exact: true })).not.toBeInTheDocument()
        await page.viewport(800, 800)
        await expect.element(screen.getByText('Планшет', { exact: true })).toBeVisible()
        await expect.element(screen.getByText('Ноутбук', { exact: true })).not.toBeInTheDocument()
        await page.viewport(1100, 800)
        await expect.element(screen.getByText('Ноутбук', { exact: true })).toBeVisible()
        await expect.element(screen.getByText('Компьютер', { exact: true })).not.toBeInTheDocument()
        await page.viewport(1400, 800)
        await expect.element(screen.getByText('Компьютер', { exact: true })).toBeVisible()
        await page.viewport(375, 800)
        await expect.element(screen.getByText('Компьютер', { exact: true })).not.toBeInTheDocument()
        await expect.element(screen.getByText('Планшет', { exact: true })).not.toBeInTheDocument()
    } finally {
        await page.viewport(previousWidth, previousHeight)
    }
})
