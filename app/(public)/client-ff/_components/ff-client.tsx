'use client';

import { useFlag, useFlagsStatus } from '@unleash/nextjs/client';

export function FFClient() {
    const enabled = useFlag('all-ff');

    const { flagsReady } = useFlagsStatus();

    if (!flagsReady) {
        return <>Loading...</>;
    }

    return (
        <div className="mt-6 space-y-3 rounded-lg border border-black p-6 shadow">
            <p>Пример использования FF с SPA.</p>
            <div className="rounded-sm border border-black p-2">
                <code>all-ff: </code>
                <strong>
                    <code>{enabled ? 'ENABLED' : 'DISABLED'}</code>
                </strong>
            </div>
        </div>
    );
}
