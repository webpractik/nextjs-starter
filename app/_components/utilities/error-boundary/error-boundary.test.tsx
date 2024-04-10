import { fireEvent, render, screen } from '@testing-library/react';
import { noop } from 'lodash-es';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { ErrorFallback } from './error-boundary';

describe('<ErrorBoundary />', () => {
    const errorMessage = 'Example error message';
    const error = { message: 'Example error message' };

    it('it renders correctly', () => {
        render(<ErrorFallback error={error} resetError={noop} />);

        const errorBoundary = screen.getByTestId('error-boundary');

        expect(errorBoundary).toBeInTheDocument();
    });

    it('it renders error message', () => {
        render(<ErrorFallback error={error} resetError={noop} />);

        const errorBoundary = screen.getByText(errorMessage);

        expect(errorBoundary).toBeInTheDocument();
    });

    it('it handles reset error', () => {
        const mockFunction = vi.fn();

        render(<ErrorFallback error={error} resetError={mockFunction} />);

        fireEvent.click(screen.getByText('Попробовать еще'));

        expect(mockFunction).toHaveBeenCalled();
    });
});
