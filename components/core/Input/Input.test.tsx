import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Input } from './Input';

describe('<Input />', () => {
    it('renders', () => {
        render(<Input />);
        const inputElement = screen.getByRole('textbox');
        expect(inputElement).toBeInTheDocument();
    });

    it('handles user input correctly', async () => {
        const user = userEvent.setup();
        render(<Input />);
        const input = screen.getByRole('textbox');

        await user.type(input, 'Hello, world!');
        expect(input).toHaveValue('Hello, world!');
    });

    it('accepts type prop', () => {
        render(<Input type="email" />);
        const inputElement = screen.getByRole('textbox');
        expect(inputElement).toHaveAttribute('type', 'email');
    });

    it('accepts custom className', () => {
        const customClass = 'my-custom-class';
        render(<Input className={customClass} />);
        const inputElement = screen.getByRole('textbox');
        expect(inputElement).toHaveClass(customClass);
    });

    it('calls custom onChange handler', async () => {
        const user = userEvent.setup();
        const onChangeMock = vi.fn();
        render(<Input onChange={onChangeMock} />);
        const input = screen.getByRole('textbox');

        await user.type(input, 'a');
        expect(onChangeMock).toHaveBeenCalledTimes(1);
    });
});
