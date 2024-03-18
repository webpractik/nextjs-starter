import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Logo } from './logo';

describe('<Logo />', () => {
    it('renders with correct props', () => {
        const { getByAltText } = render(<Logo />);

        const image = getByAltText('logo');

        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', '/images/svg/logo.svg');
    });
});
