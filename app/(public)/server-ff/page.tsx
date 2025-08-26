import { flag } from '@unleash/nextjs';

export default async function Page() {
    const { enabled } = await flag('all-ff');

    return (
        <div className="mt-6 space-y-3 rounded-lg border border-black p-6 shadow">
            <p>Пример использования FF с SSR.</p>
            <div className="rounded-sm border border-black p-2">
                <code>all-ff: </code>
                <strong>
                    <code>{enabled ? 'ENABLED' : 'DISABLED'}</code>
                </strong>
            </div>
        </div>
    );
}
