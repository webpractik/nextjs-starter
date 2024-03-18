import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Image } from './image';

describe('<Image />', () => {
    it('renders an image with src and alt text', () => {
        const testSource = '/test-image.jpg';
        const testAlt = 'test image';

        const { getByAltText } = render(
            <Image src={testSource} alt={testAlt} width={100} height={100} />
        );

        const image = getByAltText(testAlt);

        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src');
        expect(image).toHaveAttribute('alt', testAlt);
    });
});
