import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Dialog } from './Dialog';

describe('<Dialog />', () => {
    it('it should mount', () => {
        render(<Dialog data-testid="Dialog" />);

        const dialog = screen.getByTestId('Dialog');

        expect(dialog).toBeInTheDocument();
    });
});
