import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { TemplateName } from './template-name';

describe('<TemplateName />', () => {
    it('it renders correctly', () => {
        render(<TemplateName />);

        const templateName = screen.getByTestId('TemplateName');

        expect(templateName).toBeInTheDocument();
    });
});