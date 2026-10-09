import type { PetStatus } from '@repo/api'

import { createClient } from '@repo/api/client'
import { fakePet, fakePetPage, fakeProblem } from '@repo/api/mocks'
import {
    createPetMutation,
    findPetsByStatusInfiniteOptions,
    findPetsByStatusInfiniteQueryKey,
    findPetsByStatusQueryKey,
    getPetByIdOptions,
} from '@repo/api/query'
import { CancelledError, MutationObserver, QueryClient } from '@tanstack/react-query'
import * as allure from 'allure-js-commons'
import { describe, expect, it, vi } from 'vitest'

describe('публичные Query factories', () => {
    it('сохраняет base URL ключа при последующем изменении client config', async () => {
        await allure.labels(
            { name: 'layer', value: 'Unit-front' },
            { name: 'feature', value: 'API codegen' },
            { name: 'story', value: 'Совместимость публичного API при миграции Kubb' },
            { name: 'severity', value: 'normal' },
        )
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockImplementation(async () => Response.json(fakePet()))
        const client = createClient({ baseUrl: 'https://first.example.test', fetch })
        const first = getPetByIdOptions({ client, path: { petId: 'one' } })
        client.setConfig({ baseUrl: 'https://second.example.test' })
        const second = getPetByIdOptions({ client, path: { petId: 'one' } })
        const queryClient = new QueryClient()

        expect(first.queryKey).not.toStrictEqual(second.queryKey)
        await queryClient.query(first)
        await queryClient.query(second)
        expect(
            fetch.mock.calls.map(([input]) =>
                input instanceof Request ? input.url : input.toString(),
            ),
        ).toStrictEqual([
            'https://first.example.test/pets/one',
            'https://second.example.test/pets/one',
        ])
        queryClient.clear()
    })

    it('передаёт отмену Query в native Fetch signal', async () => {
        await allure.labels(
            { name: 'layer', value: 'Unit-front' },
            { name: 'feature', value: 'API codegen' },
            { name: 'story', value: 'Совместимость публичного API при миграции Kubb' },
            { name: 'severity', value: 'normal' },
        )
        const started = Promise.withResolvers<undefined>()
        const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (_input, init) => {
            started.resolve(undefined)
            return new Promise<Response>((_resolve, reject) => {
                const signal = init?.signal

                if (signal === undefined || signal === null) {
                    reject(new Error('Missing cancellation signal'))
                    return
                }

                signal.addEventListener(
                    'abort',
                    () => reject(new DOMException('Request aborted', 'AbortError')),
                    { once: true },
                )
            })
        })
        const client = createClient({ baseUrl: 'https://api.example.test', fetch })
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
        const options = getPetByIdOptions({ client, path: { petId: 'one' } })
        const result = queryClient.query(options).catch((error: unknown) => error)
        await started.promise
        await queryClient.cancelQueries({ queryKey: options.queryKey })
        await expect(result).resolves.toBeInstanceOf(CancelledError)
        expect(fetch.mock.calls[0]?.[1]?.signal?.aborted).toBe(true)
        queryClient.clear()
    })

    it('возвращает data и сохраняет tags и параметры в ключе', async () => {
        await allure.labels(
            { name: 'layer', value: 'Unit-front' },
            { name: 'feature', value: 'API codegen' },
            { name: 'story', value: 'Совместимость публичного API при миграции Kubb' },
            { name: 'severity', value: 'normal' },
        )
        const pet = fakePet()
        const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(Response.json(pet))
        const client = createClient({ baseUrl: 'https://api.example.test', fetch })
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
        const options = getPetByIdOptions({ client, path: { petId: 'one' } })

        expect(options.queryKey[0]).toMatchObject({ path: { petId: 'one' }, tags: ['pets'] })
        await expect(queryClient.query(options)).resolves.toStrictEqual(pet)
        queryClient.clear()
    })

    it('отклоняет запрос на HTTP error, сохраняя parsed error', async () => {
        await allure.labels(
            { name: 'layer', value: 'Unit-front' },
            { name: 'feature', value: 'API codegen' },
            { name: 'story', value: 'Совместимость публичного API при миграции Kubb' },
            { name: 'severity', value: 'normal' },
        )
        const problem = { ...fakeProblem(), status: 404 }
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValue(Response.json(problem, { status: 404 }))
        const client = createClient({ baseUrl: 'https://api.example.test', fetch })
        const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
        await expect(
            queryClient.query(getPetByIdOptions({ client, path: { petId: 'missing' } })),
        ).rejects.toStrictEqual(problem)
        queryClient.clear()
    })

    it('заменяет только offset для каждой страницы и отделяет infinite key', async () => {
        await allure.labels(
            { name: 'layer', value: 'Unit-front' },
            { name: 'feature', value: 'API codegen' },
            { name: 'story', value: 'Совместимость публичного API при миграции Kubb' },
            { name: 'severity', value: 'normal' },
        )
        const fetch = vi.fn<typeof globalThis.fetch>().mockImplementation(async (input) => {
            const offset = Number(
                new URL(input instanceof Request ? input.url : String(input)).searchParams.get(
                    'offset',
                ),
            )
            return Response.json({ ...fakePetPage(), limit: 20, offset, total: 100 })
        })
        const client = createClient({ baseUrl: 'https://api.example.test', fetch })
        const status: PetStatus[] = ['available']
        const query = { client, headers: { 'x-test': 'pagination' }, query: { limit: 20, status } }
        const queryClient = new QueryClient()
        expect(findPetsByStatusInfiniteQueryKey(query)).not.toStrictEqual(
            findPetsByStatusQueryKey(query),
        )
        const result = await queryClient.infiniteQuery({
            ...findPetsByStatusInfiniteOptions(query),
            initialPageParam: 20,
            pages: 2,
            getNextPageParam: (page) => page.offset + page.limit,
        })
        expect(result.pageParams).toStrictEqual([20, 40])

        for (const [input, init] of fetch.mock.calls) {
            const url = new URL(input instanceof Request ? input.url : String(input))
            expect(url.searchParams.getAll('status')).toStrictEqual(['available'])
            expect(url.searchParams.get('limit')).toBe('20')
            expect(new Headers(init?.headers).get('x-test')).toBe('pagination')
        }

        queryClient.clear()
    })

    it('компонует мутацию с MutationObserver', async () => {
        await allure.labels(
            { name: 'layer', value: 'Unit-front' },
            { name: 'feature', value: 'API codegen' },
            { name: 'story', value: 'Совместимость публичного API при миграции Kubb' },
            { name: 'severity', value: 'normal' },
        )
        const pet = fakePet()
        const fetch = vi
            .fn<typeof globalThis.fetch>()
            .mockResolvedValue(Response.json(pet, { status: 201 }))
        const client = createClient({ baseUrl: 'https://api.example.test', fetch })
        const queryClient = new QueryClient()
        const mutation = new MutationObserver(queryClient, createPetMutation({ client }))
        await expect(mutation.mutate({ body: { name: 'Pixel' } })).resolves.toStrictEqual(pet)
        queryClient.clear()
    })
})
