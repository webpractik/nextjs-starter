import { Meta, StoryObj } from '@storybook/react';

import { BasicImage } from './Image';

const meta: Meta<typeof BasicImage> = {
    title: 'core/BasicImage',
    component: BasicImage,
};

export default meta;

type Story = StoryObj<typeof BasicImage>;

export const Primary: Story = {
    args: {
        src: '/images/svg/logo.svg',
        width: 200,
        height: 100,
    },
};
