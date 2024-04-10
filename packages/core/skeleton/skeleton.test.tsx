import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './skeleton';

describe('<Skeleton />', () => {
    it('it should mount', () => {
        render(<Skeleton data-testid="Skeleton" />);

        const skeleton = screen.getByTestId('Skeleton');

        expect(skeleton).toBeInTheDocument();
    });
});
