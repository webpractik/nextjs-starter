import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

import { Input } from './Input';

describe('<Input />', () => {
    it('it should mount', () => {
        render(<Input />);

        const input = screen.getByTestId('Input');

        expect(input).toBeDefined();
    });
});
