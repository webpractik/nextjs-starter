import { Meta, StoryObj } from '@storybook/react';
import { Box } from 'components/core/Box';

import { Skeleton } from './Skeleton';

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
            <Box direction="column" gap="0.75rem">
                <Skeleton style={{ width: '250px', height: '125px', borderRadius: '25px' }} />
                <Skeleton style={{ width: '250px', height: '18px' }} />
                <Skeleton style={{ width: '200px', height: '18px' }} />
            </Box>
        );
    },
};
