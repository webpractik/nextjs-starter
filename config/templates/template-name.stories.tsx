import { Meta, StoryObj } from '@storybook/react';

import { TemplateName } from './template-name';

const meta = {
    title: 'TemplateName',
    component: TemplateName,
} satisfies Meta<typeof TemplateName>;

export default meta;

type Story = StoryObj<typeof TemplateName>;

export const Primary = {
    args: {},
} satisfies Story;
