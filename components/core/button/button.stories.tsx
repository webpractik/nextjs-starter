import { Meta, StoryObj } from '@storybook/react';

import { Button } from './button';

const meta: Meta<typeof Button> = {
    title: 'core/Button',
    component: Button,
    args: {
        children: 'Button',
    },
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        variant: 'default',
        size: 'default',
    },
};

export const Outline: Story = {
    args: {
        variant: 'outline',
        size: 'default',
    },
};

export const LinkButton: Story = {
    args: {
        variant: 'link',
        size: 'default',
    },
};

export const Small: Story = {
    args: {
        variant: 'default',
        size: 'sm',
    },
};

export const Large: Story = {
    args: {
        variant: 'default',
        size: 'lg',
    },
};

export const IconButton = {
    args: {
        variant: 'default',
        size: 'icon',
        children: <span>👋</span>,
    },
};

export const AsChild = {
    args: {
        asChild: true,
        children: <a>Link Button</a>,
    },
};
