import { render, screen } from '@testing-library/react';
import { Link } from 'core/Link';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('<Link />', () => {
    it('it should mount', () => {
        render(<Link href={'/'}>Link</Link>);

        const link = screen.getAllByRole('link')[0];

        expect(link).toBeDefined();
    });
});
