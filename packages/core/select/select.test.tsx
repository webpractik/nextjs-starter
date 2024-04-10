import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Select } from './select';

describe('<Select />', () => {
    it('it should mount', () => {
        render(<Select />);

        const select = screen.getByTestId('Select');

        expect(select).toBeInTheDocument();
    });
});
