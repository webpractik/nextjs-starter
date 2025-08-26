import { Typography } from '@repo/core/typography';

import { FFGuide } from '~/app/(public)/management-ff/_components/ff-guide';
import { FFTable } from '~/app/(public)/management-ff/_components/ff-table';

const wrapperClassName = 'rounded-lg border border-black space-y-6 p-6 shadow';

export default function AdminPage() {
    return (
        <div className="w-full space-y-6 p-6">
            <div className={wrapperClassName}>
                <Typography variant="h1">Feature Flags Management</Typography>
            </div>

            <div className={wrapperClassName}>
                <Typography className="mb-3" variant="h4">
                    Активные флаги
                </Typography>
                <FFTable />

                <Typography className="mb-3" variant="h4">
                    Как настроить
                </Typography>
                <FFGuide />
            </div>
        </div>
    );
}
