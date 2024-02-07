import { Meta, StoryObj } from '@storybook/react';

import { BasicLink } from './Link';

const meta: Meta<typeof BasicLink> = {
    title: 'core/BasicLink',
    component: BasicLink,
};

export default meta;

type Story = StoryObj<typeof BasicLink>;

export const Primary: Story = {
    args: {
        href: '/',
        children: 'Basic Link',
    },
};
