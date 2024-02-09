import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Box } from './Box';

describe('<Box />', () => {
    it('renders correctly with default props', () => {
        const { container } = render(<Box>Content</Box>);
        expect(container.firstChild).toHaveClass('flex');
        expect(container.firstChild).toHaveClass('flexDirectionRow');
        expect(container.firstChild).toHaveClass('flexWrapNowrap');
    });

    it('applies flex direction correctly', () => {
        const { container } = render(<Box direction="column">Content</Box>);
        expect(container.firstChild).toHaveClass('flexDirectionColumn');
    });
});
