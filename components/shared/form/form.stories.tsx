import { Meta, StoryObj } from '@storybook/react';
import { Form } from 'shared/form';

const meta: Meta<typeof Form> = {
    title: 'Form',
    component: Form,
};

export default meta;

type Story = StoryObj<typeof Form>;

export const Primary: Story = {
    args: {},
};
