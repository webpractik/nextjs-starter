import type { Meta, StoryObj } from '@storybook/react';

import { Tabs } from './tabs';

const meta: Meta<typeof Tabs> = {
    component: Tabs,
    title: 'core/Tabs',
};

export default meta;

type Story = StoryObj<typeof Tabs>;

export const Primary: Story = {
    args: {},
};
