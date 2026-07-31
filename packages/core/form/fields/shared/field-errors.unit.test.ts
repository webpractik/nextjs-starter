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

it('collects every user-facing message from supported nested error shapes', () => {
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

it('ignores empty values and objects without a string message', () => {
    const emptyError = new Error('placeholder')
    emptyError.message = ''

    expect(
        fieldErrorMessages(fieldWithErrors([undefined, null, '', {}, { message: 42 }, emptyError])),
    ).toEqual([])
})
