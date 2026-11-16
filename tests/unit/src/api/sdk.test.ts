import * as allure from 'allure-js-commons'
import { describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'

import { createPet, deletePet, findPetsByStatus, getPetById, updatePet } from '#/api'
import { createClient } from '#/api/client'
import { fakePet, fakePetPage, fakeProblem } from '#/api/mocks'

function responseClient(response: Response) {
    const fetch = vi.fn<typeof globalThis.fetch>().mockResolvedValue(response)
    return { client: createClient({ baseUrl: 'https://api.example.test', fetch }), fetch }
}

describe('публичный SDK', () => {
    it('проверяет успешный ответ, кодирует path и передаёт настройки Fetch/Next.js', async () => {
        await allure.story('Совместимость публичного API при миграции Kubb')
        const pet = fakePet()
        const response = Response.json(pet)
        const { client, fetch } = responseClient(response)
        const next = { revalidate: 60, tags: ['pets'] }
        const result = await getPetById({
            cache: 'force-cache',
            client,
            next,
            path: { petId: 'pet/one' },
        })

        expect(result.data).toStrictEqual(pet)
        expect(result.response).toBe(response)
        expect(result.error).toBeUndefined()
        expect(fetch.mock.calls[0]?.[0]).toContain('/pets/pet%2Fone')
        expect(fetch.mock.calls[0]?.[1]).toMatchObject({ cache: 'force-cache', next })
    })

    it('сериализует массив filters повторяющимися query-параметрами', async () => {
        await allure.story('Совместимость публичного API при миграции Kubb')
        const { client, fetch } = responseClient(Response.json(fakePetPage()))
        await findPetsByStatus({
            client,
            query: { limit: 20, offset: 40, status: ['available', 'sold'] },
        })

        const url = new URL(
            fetch.mock.calls[0]?.[0] instanceof Request
                ? fetch.mock.calls[0][0].url
                : String(fetch.mock.calls[0]?.[0] ?? ''),
        )
        expect(url.searchParams.getAll('status')).toStrictEqual(['available', 'sold'])
        expect(url.searchParams.get('offset')).toBe('40')
    })

    it.each([404, 422])(
        'возвращает parsed error для HTTP %i и бросает его при opt-in',
        async (status) => {
            await allure.story('Совместимость публичного API при миграции Kubb')
            const problem = { ...fakeProblem(), status }
            const normal = responseClient(Response.json(problem, { status }))
            const result = await getPetById({ client: normal.client, path: { petId: 'missing' } })

            expect(result.data).toBeUndefined()
            expect(result.error).toStrictEqual(problem)
            const throwing = responseClient(Response.json(problem, { status }))
            await expect(
                getPetById({
                    client: throwing.client,
                    path: { petId: 'missing' },
                    throwOnError: true,
                }),
            ).rejects.toStrictEqual(problem)
        },
    )

    it('проверяет error payload схемой соответствующего HTTP status', async () => {
        const { client } = responseClient(Response.json({ status: 'invalid' }, { status: 404 }))
        const result = await getPetById({ client, path: { petId: 'missing' } })
        expect(result.error).toBeInstanceOf(ZodError)
        expect(result.data).toBeUndefined()
        const throwing = responseClient(Response.json({ status: 'invalid' }, { status: 404 }))
        await expect(
            getPetById({ client: throwing.client, path: { petId: 'missing' }, throwOnError: true }),
        ).rejects.toBeInstanceOf(ZodError)
    })

    it('возвращает ZodError для невалидного payload и бросает его при opt-in', async () => {
        await allure.story('Совместимость публичного API при миграции Kubb')
        const { client } = responseClient(Response.json({ ...fakePet(), name: '' }))
        const result = await getPetById({ client, path: { petId: 'one' } })
        expect(result.error).toBeInstanceOf(ZodError)
        expect(result.data).toBeUndefined()
        const throwing = responseClient(Response.json({ ...fakePet(), name: '' }))
        await expect(
            getPetById({ client: throwing.client, path: { petId: 'one' }, throwOnError: true }),
        ).rejects.toBeInstanceOf(ZodError)
    })

    it('возвращает undefined для native Response 204 без разбора JSON', async () => {
        await allure.story('Совместимость публичного API при миграции Kubb')
        const response = new Response(null, { status: 204 })
        const json = vi.spyOn(response, 'json')
        const { client } = responseClient(response)
        const result = await deletePet({ client, path: { petId: 'one' } })

        expect(result.data).toBeUndefined()
        expect(result.response).toBe(response)
        expect(json).not.toHaveBeenCalled()
    })

    it.each(['create', 'update'])('отправляет JSON body мутации %s', async (operation) => {
        await allure.story('Совместимость публичного API при миграции Kubb')
        const { client, fetch } = responseClient(Response.json(fakePet(), { status: 201 }))
        await (operation === 'create'
            ? createPet({ body: { name: 'Pixel' }, client })
            : updatePet({ body: { name: 'Pixel' }, client, path: { petId: 'one' } }))
        expect(fetch.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ name: 'Pixel' }))
        expect(new Headers(fetch.mock.calls[0]?.[1]?.headers).get('content-type')).toBe(
            'application/json',
        )
        expect(fetch.mock.calls[0]?.[1]).not.toHaveProperty('contentType')
    })
})
