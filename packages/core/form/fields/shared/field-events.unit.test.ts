import { expect, it, vi } from 'vitest'

import { handleFieldBlur } from './field-events'

it('вызывает пользовательский onBlur до пометки поля как затронутого', () => {
    const calls: string[] = []
    const field = {
        handleBlur: vi.fn<() => void>(() => {
            calls.push('field')
        }),
    } as unknown as Parameters<typeof handleFieldBlur>[0]
    const onBlur = vi.fn<(_event: { type: string }) => void>(() => {
        calls.push('consumer')
    })
    const event = { type: 'blur' }

    handleFieldBlur(field, onBlur, event)

    expect(onBlur).toHaveBeenCalledWith(event)
    expect(field.handleBlur).toHaveBeenCalledOnce()
    expect(calls).toEqual(['consumer', 'field'])
})
