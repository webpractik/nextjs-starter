import * as allure from 'allure-js-commons'
import { expect, it, vi } from 'vitest'

import { handleFieldBlur } from './field-events'

it('вызывает пользовательский onBlur до пометки поля как затронутого', async () => {
    await allure.labels(
        { name: 'layer', value: 'Unit-front' },
        { name: 'feature', value: 'UI components' },
        { name: 'story', value: 'Контракт общих полей формы' },
        { name: 'severity', value: 'normal' },
    )
    const calls: string[] = []
    const field = {
        handleBlur: vi.fn<() => void>(() => {
            calls.push('field')
        }),
    }
    const onBlur = vi.fn<(_event: { type: string }) => void>(() => {
        calls.push('consumer')
    })
    const event = { type: 'blur' }

    handleFieldBlur(field, onBlur, event)

    expect(onBlur).toHaveBeenCalledWith(event)
    expect(field.handleBlur).toHaveBeenCalledTimes(1)
    expect(calls).toStrictEqual(['consumer', 'field'])
})
