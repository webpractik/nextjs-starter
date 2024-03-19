import { Meta, StoryObj } from '@storybook/react';

import { Dialog } from './dialog';

const meta: Meta<typeof Dialog> = {
    title: 'Dialog',
    component: Dialog,
};

export default meta;

type Story = StoryObj<typeof Dialog>;

export const Primary: Story = {
    args: {},
};
