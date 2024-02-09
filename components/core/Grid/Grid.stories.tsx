import { Meta, StoryObj } from '@storybook/react';

import { Grid, GridItem } from './Grid';

const meta: Meta<typeof Grid> = {
    title: 'core/Grid',
    component: Grid,
    args: {
        columns: 3,
        gap: '1rem',
    },
};

export default meta;

type Story = StoryObj<typeof Grid>;

export const Primary: Story = {
    render: args => {
        const itemStyles = { border: '1px dashed pink', padding: '2rem' };
        return (
            <Grid {...args} style={{ border: '2px solid black', padding: '.5rem' }}>
                {Array.from({ length: 9 }, (_, i) => i + 1).map(i => (
                    <GridItem key={i} style={itemStyles}>
                        Child {i}
                    </GridItem>
                ))}
            </Grid>
        );
    },
};

export const RandomItems: Story = {
    render: args => {
        const itemStyles = { border: '1px dashed pink', padding: '2rem' };
        return (
            <Grid {...args} columns={6} style={{ border: '2px solid black', padding: '.5rem' }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(i => (
                    <GridItem key={i} style={itemStyles} colSpan={Math.random() > 0.5 ? 1 : 2}>
                        Child {i}
                    </GridItem>
                ))}
            </Grid>
        );
    },
};
