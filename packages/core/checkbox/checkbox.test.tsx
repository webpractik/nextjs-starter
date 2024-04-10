import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Checkbox } from './checkbox';

describe('<Checkbox />', () => {
    it('renders correctly', () => {
        render(<Checkbox />);
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeInTheDocument();
    });

    it('can be toggled by clicking', async () => {
        render(<Checkbox />);
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).not.toBeChecked();

        await userEvent.click(checkbox);
        expect(checkbox).toBeChecked();

        await userEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });

    it('displays the CheckIcon when checked', async () => {
        render(<Checkbox />);
        const checkbox = screen.getByRole('checkbox');

        await userEvent.click(checkbox);

        const checkIcon = screen.getByTestId('check-icon');

        expect(checkIcon).toBeInTheDocument();
    });
});
