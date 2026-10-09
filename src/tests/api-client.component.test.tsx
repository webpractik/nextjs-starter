import { getPetById } from '@repo/api'
import { createClient } from '@repo/api/client'
import { fakePet } from '@repo/api/mocks'
import { getPetByIdOptions } from '@repo/api/query'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import * as allure from 'allure-js-commons'
import { afterEach, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { page } from 'vitest/browser'

function PetConsumer({ client }: { client: ReturnType<typeof createClient> }) {
    const query = useQuery(getPetByIdOptions({ client, path: { petId: 'browser-pet' } }))
    return <output>{query.data?.name ?? 'Загрузка питомца'}</output>
}

afterEach(async () => {
    await cookieStore.delete({ name: 'mock-mode', path: '/' })
    await cookieStore.delete({ name: 'mock-scenario', path: '/' })
})

it('компонует сгенерированные Query options с настоящим React provider', async () => {
    await allure.labels(
        { name: 'layer', value: 'Component-front' },
        { name: 'feature', value: 'API codegen' },
        { name: 'story', value: 'Потребитель SDK в браузере' },
        { name: 'severity', value: 'normal' },
    )
    const pet = { ...fakePet(), name: 'Browser Pixel' }
    const client = createClient({ fetch: async () => Response.json(pet) })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    await render(
        <QueryClientProvider client={queryClient}>
            <PetConsumer client={client} />
        </QueryClientProvider>,
    )
    await expect.element(page.getByRole('status')).toHaveTextContent('Browser Pixel')
    queryClient.clear()
})

it('переключает cookie mock mode между запросами одного browser client', async () => {
    await allure.labels(
        { name: 'layer', value: 'Component-front' },
        { name: 'feature', value: 'API codegen' },
        { name: 'story', value: 'Runtime переключение generated mocks' },
        { name: 'severity', value: 'normal' },
    )
    const pet = { ...fakePet(), name: 'Network Pixel' }
    const fetch = vi
        .fn<typeof globalThis.fetch>()
        .mockImplementation(async () => Response.json(pet))
    vi.stubGlobal('fetch', fetch)
    const client = createClient()
    const first = await getPetById({ client, path: { petId: 'one' }, throwOnError: true })
    expect(first.data.name).toBe('Network Pixel')
    await cookieStore.set({ name: 'mock-mode', path: '/', sameSite: 'lax', value: 'true' })
    await cookieStore.set({ name: 'mock-scenario', path: '/', sameSite: 'lax', value: 'default' })
    const mocked = await getPetById({ client, path: { petId: 'one' }, throwOnError: true })
    expect(mocked.response.headers.get('x-mock-mode')).toBe('true')
    expect(mocked.data.name).not.toBe('Network Pixel')
    expect(fetch).toHaveBeenCalledTimes(1)
    await cookieStore.delete({ name: 'mock-mode', path: '/' })
    const last = await getPetById({ client, path: { petId: 'one' }, throwOnError: true })
    expect(last.data.name).toBe('Network Pixel')
    expect(fetch).toHaveBeenCalledTimes(2)
})
