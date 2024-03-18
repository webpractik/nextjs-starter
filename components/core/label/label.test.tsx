import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Label } from './label';

describe('<Label />', () => {
    it('it should mount', () => {
        render(<Label data-testid="Label" />);

        const label = screen.getByTestId('Label');

        expect(label).toBeInTheDocument();
    });
});
