import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Tooltip } from './Tooltip';

describe('<Tooltip />', () => {
    it('it should mount', () => {
        render(<Tooltip />);

        const tooltip = screen.getByTestId('Tooltip');

        expect(tooltip).toBeInTheDocument();
    });
});
