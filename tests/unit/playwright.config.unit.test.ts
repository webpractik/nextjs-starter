import { afterEach, beforeEach, expect, it, vi } from 'vitest'

beforeEach(() => {
    vi.resetModules()
    vi.stubEnv('CI', 'false')
    vi.stubEnv('ENVIRONMENT_URL', process.env.ENVIRONMENT_URL)
})

afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
})

it.each(['development', 'standalone'])(
    'запускает собственный сервер на отдельном порту в режиме %s',
    async (mode) => {
        vi.stubEnv('PLAYWRIGHT_SERVER_MODE', mode)
        vi.stubEnv('FRONT_PORT', undefined)
        const { default: config } = await import('../../playwright.config')

        expect(config.use).toMatchObject({ baseURL: 'http://localhost:3108' })
        expect(config.webServer).toMatchObject({
            env: { PORT: '3108' },
            reuseExistingServer: false,
            url: 'http://localhost:3108',
        })
    },
)

it.each(['development', 'standalone'])(
    'сохраняет явный FRONT_PORT и запрет переиспользования в режиме %s',
    async (mode) => {
        vi.stubEnv('PLAYWRIGHT_SERVER_MODE', mode)
        vi.stubEnv('FRONT_PORT', '3199')
        const { default: config } = await import('../../playwright.config')

        expect(config.use).toMatchObject({ baseURL: 'http://localhost:3199' })
        expect(config.webServer).toMatchObject({
            env: { PORT: '3199' },
            reuseExistingServer: false,
            url: 'http://localhost:3199',
        })
    },
)
