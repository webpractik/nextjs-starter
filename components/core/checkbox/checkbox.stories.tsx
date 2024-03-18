import { Meta, StoryObj } from '@storybook/react';
import { Box } from 'core/Box';
import React from 'react';

import { Checkbox } from './checkbox';

const meta = {
    title: 'core/Checkbox',
    component: Checkbox,
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Primary: Story = {
    render: arguments_ => {
        return <Checkbox {...arguments_} />;
    },
};

export const AllStates: Story = {
    render: () => {
        return (
            <Box center gap="1rem" direction="column">
                <Checkbox id="check-1" />
                <Checkbox checked id="check-2" />
                <Checkbox disabled id="check-3" />
            </Box>
        );
    },
};
