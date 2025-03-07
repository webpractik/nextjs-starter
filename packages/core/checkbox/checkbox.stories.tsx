import type { CheckboxProps } from '@radix-ui/react-checkbox';
import type { Meta, StoryObj } from '@storybook/react';

import { Checkbox } from './checkbox';

const meta = {
    component: Checkbox,
    title: 'core/Checkbox',
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<typeof Checkbox>;

export const Primary: Story = {
    render: (props: CheckboxProps) => {
        return <Checkbox {...props} />;
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
