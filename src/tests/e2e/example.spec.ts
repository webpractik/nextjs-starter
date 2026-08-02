import { expect, test } from '@playwright/test'

test('главная страница показывает заголовок Next Starter', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading')).toContainText('Next Starter')
})

test('health endpoint сообщает о работоспособности приложения', async ({ request }) => {
    const healthResponse = await request.get('/api/health')

    expect(healthResponse.ok()).toBe(true)
    expect(await healthResponse.json()).toEqual({ message: 'OK' })
})

test('readiness endpoint сообщает о готовности приложения принимать трафик', async ({
    request,
}) => {
    const readinessResponse = await request.get('/api/ready')

    expect(readinessResponse.ok()).toBe(true)
    expect(await readinessResponse.json()).toEqual({ message: 'OK' })
})

test('metrics endpoint отдаёт метрики Prometheus как текст', async ({ request }) => {
    const metricsResponse = await request.get('/api/metrics')

    expect(metricsResponse.ok()).toBe(true)
    expect(metricsResponse.headers()['content-type']).toContain('text/plain')
})

test('неизвестный маршрут отвечает статусом 404 и показывает страницу ошибки', async ({ page }) => {
    const response = await page.goto('/unknown-route-for-e2e')

    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
})
