import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Switch } from './switch';

describe('<Switch />', () => {
    it('it renders correctly', () => {
        render(<Switch data-testid="Switch" />);

        const switchElement = screen.getByTestId('Switch');

        expect(switchElement).toBeInTheDocument();
    });

    it('can be toggled', async () => {
        render(<Switch />);
        const attribute = 'aria-checked';

        const switchComponent = screen.getByRole('switch');
        expect(switchComponent).toHaveAttribute(attribute, 'false');

        await userEvent.click(switchComponent);
        expect(switchComponent).toHaveAttribute(attribute, 'true');

        await userEvent.click(switchComponent);
        expect(switchComponent).toHaveAttribute(attribute, 'false');
    });

    it('forwards ref correctly', () => {
        const ref = vi.fn();
        render(<Switch ref={ref} />);
        expect(ref).toHaveBeenCalled();
        // eslint-disable-next-line xss/no-mixed-html,@typescript-eslint/no-unsafe-member-access
        expect(ref.mock.calls[0][0]).toBeInstanceOf(HTMLElement);
    });
});
