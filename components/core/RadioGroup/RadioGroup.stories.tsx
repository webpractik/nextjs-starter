import { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import { RadioGroup, RadioGroupItem } from './RadioGroup';

const meta: Meta<typeof RadioGroup> = {
    title: 'core/RadioGroup',
    component: RadioGroup,
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const Primary: Story = {
    args: {},

    render: () => {
        return (
            <RadioGroup defaultValue="radio-2">
                <RadioGroupItem value="radio-1" id="radio-1">
                    Option 1
                </RadioGroupItem>

                <RadioGroupItem value="radio-2" id="radio-2" />

                <RadioGroupItem disabled value="radio-3" id="radio-3" />
            </RadioGroup>
        );
    },
};
