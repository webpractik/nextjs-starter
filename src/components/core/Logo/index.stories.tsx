import { Meta, StoryObj } from '@storybook/react';
import Logo from 'core/Logo/index';
import React from 'react';

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
