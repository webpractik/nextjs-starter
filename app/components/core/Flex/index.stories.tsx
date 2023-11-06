import { Meta, StoryObj } from '@storybook/react';
import React from 'react';

import Flex from '@/components/core/Flex/index';

const meta: Meta<typeof Flex> = {
    title: 'core/Flex',
    component: Flex,
};

export default meta;

type Story = StoryObj<typeof Flex>;

export const Primary: Story = {
    render: ({
        className,
        alignItems,
        flexWrap,
        flexDirection,
        justifyContent,
        flex,
        gap,
        width,
        margin,
    }) => (
        <Flex
            className={className}
            alignItems={alignItems}
            flexWrap={flexWrap}
            flexDirection={flexDirection}
            justifyContent={justifyContent}
            flex={flex}
            gap={gap}
            width={width}
            margin={margin}
        >
            <div>DIV 1</div>
            <div>DIV 2</div>
            <div>DIV 3</div>
        </Flex>
    ),
    args: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px',
    },
};
