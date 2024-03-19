import { Meta, StoryObj } from '@storybook/react';

import { Image } from './image';

const meta: Meta<typeof Image> = {
    title: 'core/Image',
    component: Image,
};

export default meta;

type Story = StoryObj<typeof Image>;

export const Primary: Story = {
    args: {
        src: '/images/svg/logo.svg',
        width: 200,
        height: 100,
    },
};
