import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Tabs } from './tabs';

describe('<Tabs />', () => {
    it('it should mount', () => {
        render(<Tabs data-testid="Tabs" />);

        const tabs = screen.getByTestId('Tabs');

        expect(tabs).toBeInTheDocument();
    });
});
