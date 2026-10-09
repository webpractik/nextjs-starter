import * as allure from 'allure-js-commons'
import { describe, expect, it } from 'vitest'

import { normalizeFaker } from './kubb-helpers'

describe('адаптация Kubb Faker', () => {
    it('передаёт request-local Faker вложенным фабрикам без изменения глобального instance', async () => {
        await allure.labels(
            { name: 'layer', value: 'Unit-front' },
            { name: 'feature', value: 'API codegen' },
            { name: 'story', value: 'Совместимость публичного API при миграции Kubb' },
            { name: 'severity', value: 'normal' },
        )
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

    it('останавливает генерацию, если upstream изменил ожидаемую структуру', async () => {
        await allure.labels(
            { name: 'layer', value: 'Unit-front' },
            { name: 'feature', value: 'API codegen' },
            { name: 'story', value: 'Совместимость публичного API при миграции Kubb' },
            { name: 'severity', value: 'normal' },
        )
        expect(() => normalizeFaker('unrecognized factory')).toThrow('pinned generator shape')
    })
})
