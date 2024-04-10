import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Button, buttonVariants } from './button';

describe('<Button />', () => {
    it('renders the button with default variant and size', () => {
        const { getByRole } = render(<Button>Button</Button>);

        expect(getByRole('button')).toHaveClass(
            buttonVariants({ variant: 'default', size: 'default' })
        );
    });

    it('renders the button with the outline variant and small size', () => {
        const { getByRole } = render(
            <Button variant="outline" size="sm">
                Button
            </Button>
        );
        expect(getByRole('button')).toHaveClass(buttonVariants({ variant: 'outline', size: 'sm' }));
    });

    it('renders the button with the link variant', () => {
        const { getByRole } = render(<Button variant="link">Button</Button>);
        expect(getByRole('button')).toHaveClass(buttonVariants({ variant: 'link' }));
    });

    it('triggers onClick', () => {
        const onClick = vi.fn();
        const { getByRole } = render(<Button onClick={onClick}>Button</Button>);

        fireEvent.click(getByRole('button'));

        expect(onClick).toHaveBeenCalled();
    });

    it('renders button as A tag', () => {
        const { getByRole } = render(
            <Button asChild>
                <a href="https://example.com">Link Button</a>
            </Button>
        );

        const linkElement = getByRole('link');
        expect(linkElement).toBeInTheDocument();
        expect(linkElement).toHaveAttribute('href', 'https://example.com');
        expect(linkElement.tagName).toBe('A');
    });

    it('does not render a button element when asChild is true', () => {
        const { container } = render(
            <div>
                <Button asChild>Child Button</Button>
            </div>
        );

        expect(container.querySelector('button')).toBeNull();
    });
});
