import { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import Logo from '@/components/core/Logo/index';

const meta: Meta<typeof Logo> = {
    title: 'core/Logo',
    component: Logo,
};

export default meta;

type Story = StoryObj<typeof Logo>;

export const Primary: Story = {
    render: () => <Logo />,
    args: {},
};
