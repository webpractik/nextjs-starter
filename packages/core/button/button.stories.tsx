import type { Meta, StoryObj } from '@storybook/react';

import Link from 'next/link';

import { Button } from './button';

const meta: Meta<typeof Button> = {
    args: {
        children: 'Button',
    },
    component: Button,
    title: 'core/Button',
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    args: {
        size: 'default',
        variant: 'default',
    },
};

export const Outline: Story = {
    args: {
        size: 'default',
        variant: 'outline',
    },
};

export const LinkButton: Story = {
    args: {
        size: 'default',
        variant: 'link',
    },
};

export const Small: Story = {
    args: {
        size: 'sm',
        variant: 'default',
    },
};

export const Large: Story = {
    args: {
        size: 'lg',
        variant: 'default',
    },
};

export const IconButton = {
    args: {
        children: <span>👋</span>,
        size: 'icon',
        variant: 'default',
    },
};

export const AsChild = {
    args: {
        asChild: true,
        children: <Link href="/">Link Button</Link>,
    },
};
