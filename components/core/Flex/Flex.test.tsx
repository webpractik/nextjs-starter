import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Flex } from './Flex';

describe('Flex', () => {
    it('renders correctly with default props', () => {
        const { container } = render(<Flex>Content</Flex>);
        expect(container.firstChild).toHaveClass('flex');
        expect(container.firstChild).toHaveClass('flexDirectionRow');
        expect(container.firstChild).toHaveClass('flexWrapNowrap');
    });

    it('applies flex direction correctly', () => {
        const { container } = render(<Flex flexDirection="column">Content</Flex>);
        expect(container.firstChild).toHaveClass('flexDirectionColumn');
    });
});
