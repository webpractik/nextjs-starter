import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './input';

const meta: Meta<typeof Input> = {
    title: 'core/Input',
    component: Input,
    argTypes: {
        type: { control: 'text' },
        placeholder: { control: 'text' },
    },
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Primary: Story = {
    args: {
        type: 'text',
        placeholder: 'Text input',
    },
};

export const EmailDisabled: Story = {
    args: {
        type: 'email',
        placeholder: 'Email input',
        disabled: true,
    },
};

export const Password: Story = {
    args: {
        type: 'password',
        placeholder: 'Password input',
    },
};
