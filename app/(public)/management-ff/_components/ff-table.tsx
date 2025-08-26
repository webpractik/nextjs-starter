import { evaluateFlags, getDefinitions } from '@unleash/nextjs';

export async function FFTable() {
    const definitions = await getDefinitions({
        fetchOptions: {
            next: { revalidate: 15 },
        },
    });

    const { toggles } = evaluateFlags(definitions);

    return (
        <div className="overflow-x-auto">
            <table className="w-full table-auto">
                <thead>
                    <tr className="border-b">
                        <th className="py-2 text-left font-medium">Feature Flag</th>
                        <th className="py-2 text-left font-medium">Is Enabled</th>
                    </tr>
                </thead>
                <tbody>
                    {toggles.map(flag => {
                        return (
                            <tr className="border-b hover:bg-gray-50" key={flag.name}>
                                <td className="py-2">
                                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                                        {flag.name}
                                    </code>
                                </td>
                                <td className="py-2">
                                    <span
                                        className={`rounded px-2 py-1 text-xs ${
                                            flag.enabled
                                                ? 'bg-green-200 text-green-800'
                                                : 'bg-red-200 text-red-800'
                                        }`}
                                    >
                                        {flag.enabled ? 'ON' : 'OFF'}
                                    </span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
