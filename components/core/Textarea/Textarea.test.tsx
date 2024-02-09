import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Textarea } from './Textarea';

describe('<Textarea />', () => {
    it('renders correctly', () => {
        render(<Textarea data-testid="Textarea" />);
        const textarea = screen.getByTestId('Textarea');
        expect(textarea).toBeInTheDocument();
    });

    it('passes props to the textarea element', () => {
        const placeholderText = 'Placeholder...';
        render(<Textarea placeholder={placeholderText} />);
        const textarea = screen.getByPlaceholderText(placeholderText);
        expect(textarea).toBeInTheDocument();
    });

    it('handles user input correctly', async () => {
        const user = userEvent.setup();
        render(<Textarea data-testid="Textarea" />);
        const textarea = screen.getByTestId('Textarea');

        await user.type(textarea, 'Hello, world!');
        expect(textarea).toHaveValue('Hello, world!');
    });

    it('can be disabled', async () => {
        const user = userEvent.setup();
        render(<Textarea disabled data-testid="Textarea" />);
        const textarea = screen.getByTestId('Textarea');

        expect(textarea).toBeDisabled();
        await user.type(textarea, 'Text that should not appear');
        expect(textarea).toHaveValue('');
    });

    it('calls custom onChange handler', async () => {
        const user = userEvent.setup();
        const onChangeMock = vi.fn();
        render(<Textarea data-testid="Textarea" onChange={onChangeMock} />);
        const textarea = screen.getByTestId('Textarea');

        await user.type(textarea, 'a');
        expect(onChangeMock).toHaveBeenCalledTimes(1);
    });
});
