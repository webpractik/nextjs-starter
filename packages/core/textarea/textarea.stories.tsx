import type { Meta, StoryObj } from '@storybook/react';

import { Textarea } from './textarea';

const meta: Meta<typeof Textarea> = {
    component: Textarea,
    title: 'core/Textarea',
};

export default meta;

type Story = StoryObj<typeof Textarea>;

export const Primary: Story = {
    args: {
        cols: 30,
        placeholder: 'Type text here...',
        rows: 8,
    },
};
