import { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import HomeComponent from 'features/home/index';

const meta: Meta<typeof HomeComponent> = {
    title: 'features/Home',
    component: HomeComponent,
};

export default meta;

type Story = StoryObj<typeof HomeComponent>;

export const Primary: Story = {
    args: {},
};
