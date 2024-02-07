import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BasicImage } from './Image';

describe('<BasicImage />', () => {
    it('renders an image with src and alt text', () => {
        const testSrc = '/test-image.jpg';
        const testAlt = 'test image';

        const { getByAltText } = render(
            <BasicImage src={testSrc} alt={testAlt} width={100} height={100} />
        );

        const image = getByAltText(testAlt);

        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src');
        expect(image).toHaveAttribute('alt', testAlt);
    });
});
