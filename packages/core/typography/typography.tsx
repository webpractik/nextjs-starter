import { cva } from 'class-variance-authority';
import type { ComponentProps, JSX, ReactNode, Ref } from 'react';

export const typographyVariants = cva('text-balance', {
    variants: {
        variant: {
            h1: 'text-4xl font-bold',
            h2: 'text-3xl font-bold',
            h3: 'text-2xl font-semibold',
            h4: 'text-xl font-medium',
            h5: 'text-lg font-medium',
            h6: 'text-base font-medium',
            p: 'text-base font-normal',
            span: '',
        },
        color: {
            primary: 'text-black',
            secondary: 'text-slate-',
        },
        center: {
            true: 'text-center',
        },
    },
    defaultVariants: {
        variant: 'p',
    },
});

interface TypographyProps extends ComponentProps<'p'> {
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
    color?: 'primary' | 'secondary';
    className?: string;
    center?: boolean;
    children: ReactNode;
    ref?: Ref<HTMLParagraphElement>;
}

export const Typography = ({
    variant = 'p',
    color,
    center,
    className = '',
    children,
    ref,
    ...props
}: TypographyProps) => {
    const Component: keyof JSX.IntrinsicElements = variant;

    return (
        <Component
            ref={ref}
            {...props}
            className={typographyVariants({ variant, color, center, className })}
        >
            {children}
        </Component>
    );
};

Typography.displayName = 'Typography';
