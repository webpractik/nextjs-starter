import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Grid, GridItem } from './Grid';

describe('<Grid />', () => {
    it('renders correctly with default props', () => {
        const { container } = render(
            <Grid>
                <div>Child</div>
            </Grid>
        );
        expect(container.firstChild).toHaveStyle({
            gridTemplateColumns: 'repeat(3, 1fr)',
            gridGap: '1rem',
        });
    });

    it('accepts custom columns and gap', () => {
        const { container } = render(
            <Grid columns={4} gap="2rem">
                <div>Child</div>
            </Grid>
        );
        expect(container.firstChild).toHaveStyle({
            gridTemplateColumns: 'repeat(4, 1fr)',
            gridGap: '2rem',
        });
    });
});

describe('GridItem Component', () => {
    it('renders correctly with default props', () => {
        const { container } = render(<GridItem>Child</GridItem>);
        expect(container.firstChild).toHaveStyle({
            gridColumn: 'span 1',
        });
    });

    it('accepts custom colSpan', () => {
        const { container } = render(<GridItem colSpan={2}>Child</GridItem>);
        expect(container.firstChild).toHaveStyle({
            gridColumn: 'span 2',
        });
    });
});
