import { Meta, StoryObj } from '@storybook/react';

import { Tooltip } from './Tooltip';

const meta: Meta<typeof Tooltip> = {
    title: 'Tooltip',
    component: Tooltip,
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Primary: Story = {
    args: {},
};
