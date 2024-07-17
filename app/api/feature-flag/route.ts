import { evaluateFlags, getDefinitions } from '@unleash/nextjs';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const definitions = await getDefinitions({
            fetchOptions: {
                next: { revalidate: 15 },
            },
        });

        return NextResponse.json(evaluateFlags(definitions));
    } catch (error) {
        return NextResponse.json({
            status: 500,
            statusText: error,
        });
    }
}
