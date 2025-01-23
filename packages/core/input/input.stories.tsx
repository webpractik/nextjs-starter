import type { Meta, StoryObj } from '@storybook/react';

import { Input } from './input';

const meta: Meta<typeof Input> = {
    argTypes: {
        placeholder: { control: 'text' },
        type: { control: 'text' },
    },
    component: Input,
    title: 'core/Input',
};

export default meta;

type Story = StoryObj<typeof Input>;

export const Primary: Story = {
    args: {
        placeholder: 'Text input',
        type: 'text',
    },
};

export const EmailDisabled: Story = {
    args: {
        disabled: true,
        placeholder: 'Email input',
        type: 'email',
    },
};

export const Password: Story = {
    args: {
        placeholder: 'Password input',
        type: 'password',
    },
};
