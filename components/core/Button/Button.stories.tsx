import { Meta, StoryObj } from '@storybook/react';

import { Button } from './Button';

const meta: Meta<typeof Button> = {
    title: 'core/Button',
    component: Button,
};

export default meta;

type Story = StoryObj<typeof Button>;

export const Primary: Story = {
    render: () => (
        <Button variant="primary" size="primary">
            Primary
        </Button>
    ),
};

export const Outline: Story = {
    render: () => (
        <Button variant="outline" size="primary">
            Outline
        </Button>
    ),
};

export const LinkButton: Story = {
    render: () => (
        <Button variant="link" size="primary">
            Link
        </Button>
    ),
};

export const Small: Story = {
    render: () => (
        <Button variant="primary" size="sm">
            Small
        </Button>
    ),
};

export const Large: Story = {
    render: () => (
        <Button variant="primary" size="lg">
            Large
        </Button>
    ),
};

export const IconButton = {
    render: () => (
        <Button variant="primary" size="icon">
            <span>👋</span>
        </Button>
    ),
};

export const AsChild = {
    render: () => (
        <Button asChild size="sm">
            <a href="#">Link Button</a>
        </Button>
    ),
};
