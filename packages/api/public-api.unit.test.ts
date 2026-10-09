import type { getPetById, Pet } from '@repo/api'

import { deletePet, PetStatus } from '@repo/api'
import { createClient } from '@repo/api/client'
import * as allure from 'allure-js-commons'
import { expect, expectTypeOf, it } from 'vitest'

it('сохраняет типизацию результата, opt-in throw и string enum', async () => {
    await allure.labels(
        { name: 'layer', value: 'Unit-front' },
        { name: 'feature', value: 'API codegen' },
        { name: 'story', value: 'Статический контракт публичного SDK' },
        { name: 'severity', value: 'normal' },
    )
    const client = createClient({ fetch: async () => new Response(null, { status: 204 }) })
    const deleted = await deletePet({ client, path: { petId: 'one' }, throwOnError: true })
    expectTypeOf(deleted.data).toEqualTypeOf<undefined>()

    type PetResult = Awaited<ReturnType<typeof getPetById<true>>>

    expectTypeOf<PetResult['data']>().toEqualTypeOf<Pet>()
    expectTypeOf<PetResult['error']>().toEqualTypeOf<undefined>()
    expect(PetStatus.available).toBe('available')
})
