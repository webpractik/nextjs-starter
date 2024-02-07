import { Meta, StoryObj } from '@storybook/react';

import { Input } from './Input';

const meta: Meta<typeof Input> = {
    title: 'component/Input',
    component: Input,
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Primary: Story = {
    args: {},
};
