import { NextResponse } from 'next/server';

export function GET() {
    return NextResponse.json({ message: 'OK' }, { status: 200 });
}
