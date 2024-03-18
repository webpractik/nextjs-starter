import { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';

const meta: Meta<typeof Tooltip> = {
    title: 'core/Tooltip',
    component: Tooltip,
};

export default meta;

type Story = StoryObj<typeof Tooltip>;

export const Primary: Story = {
    args: {
        delayDuration: 0,
    },
    render: (...arguments_) => (
        <TooltipProvider>
            <Tooltip {...arguments_}>
                <TooltipTrigger>Hover me</TooltipTrigger>
                <TooltipContent>
                    <p>Tooltip content</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    ),
};
