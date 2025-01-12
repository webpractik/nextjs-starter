import type { Meta, StoryObj } from '@storybook/react';

import { Label } from './label';

const meta: Meta<typeof Label> = {
    title: 'core/Label',
    component: Label,
};

export default meta;

type Story = StoryObj<typeof Label>;

export const Primary: Story = {
    args: {},
};
