import { Meta, StoryObj } from '@storybook/react';
import { Flex } from 'core/Flex';
import React from 'react';

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
            <div>FLEX CHILD 1</div>
            <div>FLEX CHILD 2</div>
            <div>FLEX CHILD 3</div>
        </Flex>
    ),
    args: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2rem',
    },
};
