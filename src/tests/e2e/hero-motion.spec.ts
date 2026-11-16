import { expect, test } from '@playwright/test'

test.use({ reducedMotion: 'reduce' })

test('показывает Hero без анимации при уменьшенном движении после загрузки страницы', async ({
    page,
}) => {
    const hydrationErrors: string[] = []
    page.on('console', (message) => {
        if (message.type() === 'error' && /hydration|hydrated/i.test(message.text())) {
            hydrationErrors.push(message.text())
        }
    })

    await page.goto('/')
    const content = page.getByRole('heading', { level: 1, name: 'Next Starter' }).locator('..')

    await expect(content).toHaveCSS('opacity', '1')
    await expect(content).toHaveCSS('filter', 'none')
    await expect(content).toHaveCSS('transform', 'none')
    expect(hydrationErrors).toStrictEqual([])
})

test.describe('без JavaScript', () => {
    test.use({ javaScriptEnabled: false })

    test('сразу показывает Hero без размытия и перемещения при уменьшенном движении', async ({
        page,
    }) => {
        await page.goto('/')
        const content = page.getByRole('heading', { level: 1, name: 'Next Starter' }).locator('..')

        await expect(content).toHaveCSS('opacity', '1')
        await expect(content).toHaveCSS('filter', 'none')
        await expect(content).toHaveCSS('transform', 'none')
    })
})
