import type { Request } from '@playwright/test'

import { expect, test } from '@playwright/test'

test.skip(process.env.FORESIGHT_E2E !== 'true', 'Требует production-сборку с временными fixtures')

for (const touch of [false, true]) {
    test(`Foresight: видимость не загружает ссылки, сигнал запускает prefetch (${touch ? 'touch' : 'desktop'})`, async ({
        baseURL,
        browser,
    }, testInfo) => {
        const context = await browser.newContext({ baseURL, hasTouch: touch, isMobile: touch })
        const page = await context.newPage()
        const requests: Request[] = []
        page.on('request', (request) => {
            const url = new URL(request.url())

            if (/\/e2e-foresight\/(?:first|second|disabled)/.test(url.pathname)) {
                requests.push(request)
            }
        })

        try {
            await page.goto('/e2e-foresight/navigation')
            const first = page.getByRole('link', { name: 'Первая страница' })
            await expect(first).toBeInViewport()
            await expect(page.getByRole('link', { name: 'Вторая страница' })).toBeInViewport()
            // Даём viewport observer и hydration завершиться до проверки отсутствия запросов.
            await page.waitForTimeout(2000)
            expect(requests).toHaveLength(0)
            await (touch
                ? first.dispatchEvent('pointerdown', { pointerType: 'touch' })
                : first.hover())
            await expect.poll(() => requests.length).toBeGreaterThan(0)
            expect(
                requests.every(
                    (request) => new URL(request.url()).pathname === '/e2e-foresight/first',
                ),
            ).toBe(true)
            const response = await requests[0]?.response()
            expect(response?.ok()).toBe(true)
            expect(requests[0]?.headers().rsc).toBe('1')
            await testInfo.attach('prefetch-network.json', {
                body: JSON.stringify(
                    requests.map((request) => ({
                        url: request.url(),
                        rsc: request.headers().rsc,
                        prefetch: request.headers()['next-router-prefetch'],
                    })),
                    null,
                    2,
                ),
                contentType: 'application/json',
            })
            const disabled = page.getByRole('link', { name: 'Без предзагрузки' })
            await (touch
                ? disabled.dispatchEvent('pointerdown', { pointerType: 'touch' })
                : disabled.hover())
            await page.waitForTimeout(500)
            expect(requests.map((request) => new URL(request.url()).pathname)).not.toContain(
                '/e2e-foresight/disabled',
            )
            await first.click()
            await expect(page).toHaveURL(/\/e2e-foresight\/first$/)
            await expect(page.getByRole('heading', { name: 'Целевая страница' })).toBeVisible()
        } finally {
            await context.close()
        }
    })
}
