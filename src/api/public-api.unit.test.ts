import type { getPetById, Pet } from '#/api'

import * as allure from 'allure-js-commons'
import { expect, expectTypeOf, it } from 'vitest'

import { deletePet, PetStatus } from '#/api'
import { createClient } from '#/api/client'

it('сохраняет типизацию результата, opt-in throw и string enum', async () => {
    await allure.story('Статический контракт публичного SDK')
    const client = createClient({ fetch: async () => new Response(null, { status: 204 }) })
    const deleted = await deletePet({ client, path: { petId: 'one' }, throwOnError: true })
    expectTypeOf(deleted.data).toEqualTypeOf<undefined>()

    type PetResult = Awaited<ReturnType<typeof getPetById<true>>>

    expectTypeOf<PetResult['data']>().toEqualTypeOf<Pet>()
    expectTypeOf<PetResult['error']>().toEqualTypeOf<undefined>()
    expect(PetStatus.available).toBe('available')
})
