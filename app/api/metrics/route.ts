import { NextResponse } from 'next/server'

import { register } from '#/observability/metrics'

export async function GET() {
    const metrics = await register.metrics()

    const newHeaders = new Headers()

    newHeaders.set('Content-Type', register.contentType)

    return new NextResponse(metrics, { headers: newHeaders })
}
