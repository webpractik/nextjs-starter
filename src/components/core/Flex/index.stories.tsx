import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Flex from '@/components/core/Flex';

export default {
    title: 'core/Flex',
    component: Flex,
} as ComponentMeta<typeof Flex>;

const Template: ComponentStory<typeof Flex> = args => (
    <Flex {...args}>
        <div>DIV 1</div>
        <div>DIV 2</div>
        <div>DIV 3</div>
    </Flex>
);

export const Default = Template.bind({});
Default.args = {
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
};
