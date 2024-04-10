import { Meta, StoryObj } from '@storybook/react';

import { Switch } from './switch';

const meta: Meta<typeof Switch> = {
    title: 'core/Switch',
    component: Switch,
};

export default meta;

type Story = StoryObj<typeof Switch>;

export const Primary: Story = {
    args: {},
    render: () => {
        return (
            <div className="flex flex-col gap-2">
                <Switch />
                <Switch checked />
                <Switch disabled />
            </div>
        );
    },
};
