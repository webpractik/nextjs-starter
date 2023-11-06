import { Meta, StoryObj } from '@storybook/react';
import HomeComponent from 'features/home/index';

const meta: Meta<typeof HomeComponent> = {
    title: 'features/Home',
    component: HomeComponent,
    parameters: {
        nextjs: {
            appDirectory: true,
        },
    },
};

export default meta;

type Story = StoryObj<typeof HomeComponent>;

export const Primary: Story = {
    args: {},
};
