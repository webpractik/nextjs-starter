import deepmerge from 'deepmerge'
import { describe, expect, it } from 'vitest'

const payload = { ['__proto__']: { isAdmin: true }, safe: true }
const emptyTarget = {}
Object.setPrototypeOf(emptyTarget, null)

describe('безопасность deepmerge', () => {
    it.each([
        { name: 'источника', target: emptyTarget, source: payload },
        { name: 'целевого объекта', target: payload, source: {} },
    ])('не переносит __proto__ из $name', ({ source, target }) => {
        const result = deepmerge(target, source)

        expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
        expect(result).not.toHaveProperty('isAdmin')
        expect(Object.hasOwn(result, '__proto__')).toBe(false)
        expect(result).toStrictEqual({ safe: true })
    })

    it.each([
        {
            name: 'вложенного объекта',
            merge: () =>
                deepmerge<{ session: typeof payload | null }>(
                    { session: null },
                    { session: payload },
                ).session,
        },
        {
            name: 'элемента массива',
            merge: () => deepmerge({ values: [] }, { values: [payload] }).values[0],
        },
    ])('отбрасывает __proto__ при клонировании $name', ({ merge }) => {
        const result = merge()

        expect(Object.getPrototypeOf(result)).toBe(Object.prototype)
        expect(result).not.toHaveProperty('isAdmin')
        expect(result).toStrictEqual({ safe: true })
    })

    it('сохраняет слияние тем shadcn с заменой массивов без изменения входных данных', () => {
        const target = { theme: { colors: { red: '#f00' }, fontFamily: ['old'] } }
        const source = { theme: { colors: { blue: '#00f' }, fontFamily: ['new'] } }

        expect(
            deepmerge(target, source, {
                arrayMerge: (_target: unknown[], values: unknown[]) => values,
            }),
        ).toStrictEqual({
            theme: { colors: { red: '#f00', blue: '#00f' }, fontFamily: ['new'] },
        })
        expect(target).toStrictEqual({ theme: { colors: { red: '#f00' }, fontFamily: ['old'] } })
        expect(source).toStrictEqual({ theme: { colors: { blue: '#00f' }, fontFamily: ['new'] } })
        expect(deepmerge({ values: [1] }, { values: [2] })).toStrictEqual({ values: [1, 2] })
    })
})
