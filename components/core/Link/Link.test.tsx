import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { BasicLink } from './Link';

describe('<Link />', () => {
    it('it should mount', () => {
        render(<BasicLink href={'/'}>Link</BasicLink>);

        const link = screen.getAllByRole('link')[0];

        expect(link).toBeDefined();
    });
});
