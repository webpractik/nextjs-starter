import { Meta, StoryObj } from '@storybook/react';

import { Skeleton } from './skeleton';

const meta: Meta<typeof Skeleton> = {
    title: 'core/Skeleton',
    component: Skeleton,
};

export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Primary: Story = {
    args: {},
    render: () => {
        return (
            <div className="flex flex-col gap-1">
                <Skeleton className="h-32 w-64 rounded" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-52" />
            </div>
        );
    },
};
