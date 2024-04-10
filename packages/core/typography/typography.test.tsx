import { render } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Typography, typographyVariants } from './typography';

describe('<Typography />', () => {
    it('renders correctly with variant and children', () => {
        const { getByText } = render(<Typography variant="h1">Heading 1</Typography>);
        expect(getByText('Heading 1').tagName).toBe('H1');
        expect(getByText('Heading 1')).toHaveClass(typographyVariants({ variant: 'h1' }));
    });

    it('applies color classes correctly', () => {
        const { getByText } = render(<Typography color="primary">Primary Text</Typography>);
        expect(getByText('Primary Text')).toHaveClass(
            typographyVariants({ variant: 'p', color: 'primary' })
        );
    });
});
