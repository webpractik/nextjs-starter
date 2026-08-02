import { NextRequest, NextResponse } from 'next/server'
import { describe, expect, it } from 'vitest'

import { injectHeaders } from './inject-headers'

describe('добавление служебных заголовков прокси', () => {
    it('передаёт исходные заголовки дальше и добавляет полный URL текущего запроса', async () => {
        const request = new NextRequest('https://frontend.example.test/catalog?status=available', {
            headers: {
                cookie: 'session=active',
                'x-url': 'https://attacker.example.test/forged',
            },
        })

        const response = await injectHeaders(request, NextResponse.next())

        expect(response.headers.get('x-middleware-request-cookie')).toBe('session=active')
        expect(response.headers.get('x-middleware-request-x-url')).toBe(
            'https://frontend.example.test/catalog?status=available',
        )
    })
})
