import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';

import HomeComponent from './index';

it('render home', () => {
    render(<HomeComponent />);

    expect(screen.getByRole('heading', { level: 1, name: /nextjs starter/i })).toBeDefined();
    expect(screen.getByRole('img', { name: /logo/i })).toBeDefined();
});
