import { Meta, StoryObj } from '@storybook/react';
import { Logo } from 'components/core/logo';

const meta: Meta<typeof Logo> = {
    title: 'core/Logo',
    component: Logo,
};

export default meta;

type Story = StoryObj<typeof Logo>;

export const Primary: Story = {
    args: {},
};
