import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import HomeComponent from 'features/home/index';

export default {
    title: 'features/Home',
    component: HomeComponent,
} as ComponentMeta<typeof HomeComponent>;

const Template: ComponentStory<typeof HomeComponent> = args => <HomeComponent />;

export const Default = Template.bind({});
Default.args = {};
