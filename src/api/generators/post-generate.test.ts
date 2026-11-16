import * as allure from 'allure-js-commons'
import { describe, expect, it } from 'vitest'

import { normalizeFaker } from './kubb-helpers'

describe('адаптация Kubb Faker', () => {
    it('передаёт request-local Faker вложенным фабрикам без изменения глобального instance', async () => {
        await allure.story('Совместимость публичного API при миграции Kubb')
        const source = `import { fakerEN as faker } from '@faker-js/faker'
export function fakePet(data?: Partial<Pet>) {
    return { name: faker.string.alpha(), status: fakeStatus(), ...data }
}`
        const result = normalizeFaker(source)
        expect(result).toContain('options: FactoryOptions = {}')
        expect(result).toContain('(options.faker ?? defaultFaker).string.alpha()')
        expect(result).toContain('fakeStatus(options)')
        expect(result).not.toContain('fakerEN as faker')
    })

    it('адаптирует делегирующие фабрики без импорта Faker', () => {
        const source = `import { fakePet } from './createPet'
export function fakeCreatePetResponse(data?: Partial<Pet>): Pet {
    return fakePet(data)
}`
        expect(normalizeFaker(source)).toContain('return fakePet(options, data)')
    })

    it('не добавляет неиспользуемые параметры фабрикам пустого ответа', () => {
        const source = `export function fakeDeletePetResponse() { return undefined }`
        expect(normalizeFaker(source)).toContain(
            'fakeDeletePetResponse(_options: FactoryOptions = {})',
        )
    })

    it('останавливает генерацию, если upstream изменил ожидаемую структуру', async () => {
        await allure.story('Совместимость публичного API при миграции Kubb')
        expect(() => normalizeFaker('unrecognized factory')).toThrow('pinned generator shape')
    })
})
