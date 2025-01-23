import type { Meta, StoryObj } from '@storybook/react';

import { RadioGroup, RadioGroupItem } from './radio-group';

const meta: Meta<typeof RadioGroup> = {
    component: RadioGroup,
    title: 'core/RadioGroup',
};

export default meta;

type Story = StoryObj<typeof RadioGroup>;

export const Primary: Story = {
    args: {},

    render: () => {
        return (
            <RadioGroup defaultValue="radio-2">
                <RadioGroupItem id="radio-1" value="radio-1">
                    Option 1
                </RadioGroupItem>

                <RadioGroupItem id="radio-2" value="radio-2" />

                <RadioGroupItem disabled id="radio-3" value="radio-3" />
            </RadioGroup>
        );
    },
};
