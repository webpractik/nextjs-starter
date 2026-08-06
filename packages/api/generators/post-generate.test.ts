import { describe, expect, it } from 'vitest'

import { normalizeErrorResult, normalizeNoContentResult } from './post-generate'

describe('совместимость после генерации Hey API', () => {
    it('преобразует нативный ответ 204 в void без разбора JSON', () => {
        const source = `if (response.status === 204 || response.headers.get('Content-Length') === '0') {
          let emptyData: any;
        }`

        const result = normalizeNoContentResult(source)

        expect(result).toContain('if (response.status === 204)')
        expect(result).toContain('data: undefined')
        expect(result).toContain("if (response.headers.get('Content-Length') === '0')")
    })

    it('явно сообщает об ошибке при изменении ожидаемой формы generated-клиента', () => {
        expect(() => normalizeNoContentResult('unrecognized client source')).toThrow(
            '204 response branch',
        )
    })

    it('сохраняет discriminant data: undefined в non-throwing error result', () => {
        const source = `return {
                error: finalError,
                response,
            }`

        expect(normalizeErrorResult(source)).toContain(`return {
                data: undefined,
                error: finalError,`)
    })

    it('останавливается, если форма error result изменилась в новой версии Hey API', () => {
        expect(() => normalizeErrorResult('unrecognized client source')).toThrow(
            'error result branch',
        )
    })
})
