import { Meta, StoryObj } from '@storybook/react';
import { Box } from 'core/Box';

import { Switch } from './Switch';

const meta: Meta<typeof Switch> = {
    title: 'core/Switch',
    component: Switch,
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const Primary: Story = {
    args: {},
    render: () => {
        return (
            <Box direction="column" gap="1rem">
                <Switch />
                <Switch checked />
                <Switch disabled />
            </Box>
        );
    },
};
