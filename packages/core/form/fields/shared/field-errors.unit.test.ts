import { expect, it } from 'vitest'

import { fieldErrorMessages } from './field-errors'

function fieldWithErrors(errors: unknown[]) {
    return {
        state: {
            meta: {
                errors,
            },
        },
    } as Parameters<typeof fieldErrorMessages>[0]
}

it('собирает пользовательские сообщения из всех поддерживаемых вложенных форм ошибок', () => {
    expect(
        fieldErrorMessages(
            fieldWithErrors([
                'Required',
                new Error('Invalid email'),
                { message: 'Already used' },
                ['Nested', true, false, 0, 404, [{ message: 'Deep issue' }]],
            ]),
        ),
    ).toEqual([
        'Required',
        'Invalid email',
        'Already used',
        'Nested',
        'true',
        'false',
        '0',
        '404',
        'Deep issue',
    ])
})

it('игнорирует пустые значения и объекты без строкового сообщения', () => {
    const emptyError = new Error('placeholder')
    emptyError.message = ''

    expect(
        fieldErrorMessages(fieldWithErrors([undefined, null, '', {}, { message: 42 }, emptyError])),
    ).toEqual([])
})
