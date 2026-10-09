import { en, Faker } from '@faker-js/faker'
import * as mocks from '@repo/api/mocks'
import {
    zCreatePet,
    zDeletePetResponse,
    zPet,
    zPetPage,
    zProblem,
    zUpdatePet,
} from '@repo/api/schemas'
import * as allure from 'allure-js-commons'
import { describe, expect, it } from 'vitest'

function seededFaker(seed: number) {
    const faker = new Faker({ locale: [en] })
    faker.seed(seed)
    faker.setDefaultRefDate('2026-01-01T00:00:00Z')
    return faker
}

describe('схемы и Faker через публичные facets', () => {
    it('сохраняет ограничения, defaults и удаление дополнительных полей', async () => {
        await allure.labels(
            { name: 'layer', value: 'Unit-front' },
            { name: 'feature', value: 'API codegen' },
            { name: 'story', value: 'Валидация публичных схем' },
            { name: 'severity', value: 'normal' },
        )
        const pet = mocks.fakePet({ faker: seededFaker(100) })
        expect(zPet.parse({ ...pet, extra: true })).toStrictEqual(pet)

        for (const invalid of [
            { name: '' },
            { name: 'x'.repeat(121) },
            { status: 'unknown' },
            { createdAt: 'yesterday' },
            { id: '' },
        ]) {
            expect(zPet.safeParse({ ...pet, ...invalid }).success).toBe(false)
        }

        expect(zCreatePet.parse({ name: 'Pixel' })).toStrictEqual({
            name: 'Pixel',
            status: 'available',
        })
        expect(zUpdatePet.parse({})).toStrictEqual({})
        expect(zDeletePetResponse.safeParse(undefined).success).toBe(true)
        expect(zDeletePetResponse.safeParse({}).success).toBe(false)
    })

    it('проверяет все документированные response-фабрики их модельными схемами', async () => {
        await allure.labels(
            { name: 'layer', value: 'Unit-front' },
            { name: 'feature', value: 'API codegen' },
            { name: 'story', value: 'Generated fixtures соответствуют контракту' },
            { name: 'severity', value: 'normal' },
        )
        const options = { faker: seededFaker(42) }

        for (const factory of [
            mocks.fakePet,
            mocks.fakeCreatePetResponse201,
            mocks.fakeGetPetByIdResponse200,
            mocks.fakeUpdatePetResponse200,
        ]) {
            expect(zPet.safeParse(factory(options)).success).toBe(true)
        }

        for (const factory of [
            mocks.fakeProblem,
            mocks.fakeCreatePetResponse422,
            mocks.fakeDeletePetResponse404,
            mocks.fakeFindPetsByStatusResponse422,
            mocks.fakeGetPetByIdResponse404,
            mocks.fakeUpdatePetResponse404,
            mocks.fakeUpdatePetResponse422,
        ]) {
            expect(zProblem.safeParse(factory(options)).success).toBe(true)
        }

        expect(zPetPage.safeParse(mocks.fakePetPage(options)).success).toBe(true)
        expect(zPetPage.safeParse(mocks.fakeFindPetsByStatusResponse200(options)).success).toBe(
            true,
        )
        expect(zCreatePet.safeParse(mocks.fakeCreatePetRequest(options).body).success).toBe(true)
        expect(zUpdatePet.safeParse(mocks.fakeUpdatePetRequest(options).body).success).toBe(true)
    })

    it('изолирует seed и вложенные фабрики от других вызовов', async () => {
        await allure.labels(
            { name: 'layer', value: 'Unit-front' },
            { name: 'feature', value: 'API codegen' },
            { name: 'story', value: 'Изоляция request-local Faker' },
            { name: 'severity', value: 'normal' },
        )
        const first = mocks.fakePetPage({ faker: seededFaker(100) })
        mocks.fakePetPage({ faker: seededFaker(999) })
        expect(mocks.fakePetPage({ faker: seededFaker(100) })).toStrictEqual(first)
    })
})
