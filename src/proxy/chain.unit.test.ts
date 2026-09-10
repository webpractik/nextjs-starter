import type { ProxyFn } from './chain'

import { NextRequest } from 'next/server'
import { describe, expect, it } from 'vitest'

import { chainProxy } from './chain'

describe('цепочка прокси', () => {
    it('применяет прокси по порядку и передаёт промежуточный ответ следующему этапу', async () => {
        const appendFirstStage: ProxyFn = (_request, response) => {
            response.headers.set('x-proxy-stages', 'first')
            return response
        }

        const appendSecondStage: ProxyFn = (_request, response) => {
            response.headers.append('x-proxy-stages', 'second')
            return response
        }

        const response = await chainProxy([appendFirstStage, appendSecondStage])(
            new NextRequest('https://frontend.example.test/catalog'),
        )

        expect(response.headers.get('x-proxy-stages')).toBe('first, second')
        expect(response.headers.get('x-middleware-next')).toBe('1')
    })

    it('возвращает обычный Response сразу и не применяет последующие преобразования', async () => {
        const redirect: ProxyFn = () =>
            new Response(null, {
                headers: { location: 'https://frontend.example.test/login' },
                status: 307,
            })

        const appendLateHeader: ProxyFn = (_request, response) => {
            response.headers.set('x-late-stage', 'applied')
            return response
        }

        const response = await chainProxy([redirect, appendLateHeader])(
            new NextRequest('https://frontend.example.test/account'),
        )

        expect(response.status).toBe(307)
        expect(response.headers.get('location')).toBe('https://frontend.example.test/login')
        expect(response.headers.has('x-late-stage')).toBe(false)
    })
})
