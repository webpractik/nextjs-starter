import { Meta, StoryObj } from '@storybook/react';

import { Textarea } from './textarea';

const meta: Meta<typeof Textarea> = {
    title: 'core/Textarea',
    component: Textarea,
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Primary: Story = {
    args: {
        placeholder: 'Type text here...',
        cols: 30,
        rows: 8,
    },
};
