import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { TemplateName } from './TemplateName';

describe('<TemplateName />', () => {
    it('it should mount', () => {
        render(<TemplateName />);

        const templateName = screen.getByTestId('TemplateName');

        expect(templateName).toBeDefined();
    });
});
