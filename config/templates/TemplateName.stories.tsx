import { Meta, StoryObj } from '@storybook/react';

import { TemplateName } from './TemplateName';

const meta: Meta<typeof TemplateName> = {
    title: 'component/TemplateName',
    component: TemplateName,
};

export default meta;

type Story = StoryObj<typeof TemplateName>;

export const Primary: Story = {
    args: {},
};
