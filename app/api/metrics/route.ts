import { register } from '@repo/metrics';
import { NextResponse } from 'next/server';

export async function GET() {
    const metrics = await register.metrics();

    const newHeaders = new Headers();

    newHeaders.set('Content-Type', register.contentType);

    return NextResponse.json(metrics, { headers: newHeaders });
}
