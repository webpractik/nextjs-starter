import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import { Button } from './Button';

export default {
    title: 'Example/Button',
    component: Button,
    argTypes: {
        backgroundColor: { control: 'color' },
    },
} as ComponentMeta<typeof Button>;

type ButtonTemplate = ComponentStory<typeof Button>;

const Template: ButtonTemplate = args => <Button {...args} />;

export const Primary = Template.bind({}) as ButtonTemplate;
Primary.args = {
    primary: true,
    label: 'Button',
};

export const Secondary = Template.bind({}) as ButtonTemplate;
Secondary.args = {
    label: 'Button',
};

export const Large = Template.bind({}) as ButtonTemplate;
Large.args = {
    size: 'large',
    label: 'Button',
};

export const Small = Template.bind({}) as ButtonTemplate;
Small.args = {
    size: 'small',
    label: 'Button',
};
