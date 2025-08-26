/* eslint-disable react-perf/jsx-no-new-object-as-prop */
/* eslint-disable sonarjs/pseudo-random */
import { FlagProvider } from '@unleash/nextjs/client';
import { cookies } from 'next/headers';

import { FFClient } from '~/app/(public)/client-ff/_components/ff-client';

const COOKIE_NAME = 'unleash-session-id';

export default async function Page() {
    const allCookies = await cookies();

    const unleashSessionId = allCookies.get(COOKIE_NAME)?.value;
    const randomSessionId = Math.floor(Math.random() * 1_000_000_000).toString();
    const sessionId = unleashSessionId || randomSessionId;

    return (
        <FlagProvider config={{ context: { sessionId } }}>
            <FFClient />
        </FlagProvider>
    );
}
