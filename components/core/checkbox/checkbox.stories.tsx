import { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { Checkbox } from './checkbox';

const meta = {
    title: 'core/Checkbox',
    component: Checkbox,
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Primary: Story = {
    render: arguments_ => {
        return <Checkbox {...arguments_} />;
    },
};

export const AllStates: Story = {
    render: () => {
        return (
            <div className="flex flex-col items-center justify-center gap-2">
                <Checkbox id="check-1" />
                <Checkbox checked id="check-2" />
                <Checkbox disabled id="check-3" />
            </div>
        );
    },
};
