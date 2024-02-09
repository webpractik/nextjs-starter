import { Meta, StoryObj } from '@storybook/react';
import { Box } from 'components/core/Box';
import React from 'react';

const meta: Meta<typeof Box> = {
    title: 'core/Box',
    component: Box,
};

export default meta;

type Story = StoryObj<typeof Box>;

export const Primary: Story = {
    render: ({
        className,
        alignItems,
        wrap,
        direction,
        justifyContent,
        flex,
        gap,
        width,
        margin,
    }) => (
        <Box
            className={className}
            alignItems={alignItems}
            wrap={wrap}
            direction={direction}
            justifyContent={justifyContent}
            flex={flex}
            gap={gap}
            width={width}
            margin={margin}
        >
            <div>CHILD 1</div>
            <div>CHILD 2</div>
            <div>CHILD 3</div>
        </Box>
    ),
    args: {
        direction: 'column',
        gap: '3rem',
    },
};
