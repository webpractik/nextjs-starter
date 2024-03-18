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
        variant: 'primary',
        size: 'primary',
    },
};

export const Outline: Story = {
    args: {
        variant: 'outline',
        size: 'primary',
    },
};

export const LinkButton: Story = {
    args: {
        variant: 'link',
        size: 'primary',
    },
};

export const Small: Story = {
    args: {
        variant: 'primary',
        size: 'sm',
    },
};

export const Large: Story = {
    args: {
        variant: 'primary',
        size: 'lg',
    },
};

export const IconButton = {
    args: {
        variant: 'primary',
        size: 'icon',
        children: <span>👋</span>,
    },
};

export const AsChild = {
    args: {
        asChild: true,
        children: <a href="#">Link Button</a>,
    },
};
