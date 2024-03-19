import { Meta, StoryObj } from '@storybook/react';

import { Link } from './link';

const meta: Meta<typeof Link> = {
    title: 'core/Link',
    component: Link,
};

export default meta;

type Story = StoryObj<typeof Link>;

export const Primary: Story = {
    args: {
        href: '/',
        children: 'Basic Link',
    },
};
