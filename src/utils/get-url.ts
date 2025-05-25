import { headers } from 'next/headers';

export async function getURL() {
    const headersList = await headers();

    const url = headersList.get('x-url') ?? '';

    return new URL(url);
}
