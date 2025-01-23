import type { ComponentProps, JSX, ReactNode, Ref } from 'react';

import { cva } from 'class-variance-authority';

export const typographyVariants = cva('text-balance', {
    defaultVariants: {
        variant: 'p',
    },
    variants: {
        center: {
            true: 'text-center',
        },
        color: {
            primary: 'text-black',
            secondary: 'text-slate-',
        },
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
    },
});

type TypographyProps = {
    center?: boolean;
    children: ReactNode;
    className?: string;
    color?: 'primary' | 'secondary';
    ref?: Ref<HTMLParagraphElement>;
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span';
} & ComponentProps<'p'>

export function Typography({
    center,
    children,
    className = '',
    color,
    ref,
    variant = 'p',
    ...props
}: TypographyProps) {
    const Component: keyof JSX.IntrinsicElements = variant;

    return (
        <Component
            ref={ref}
            {...props}
            className={typographyVariants({ center, className, color, variant })}
        >
            {children}
        </Component>
    );
}

Typography.displayName = 'Typography';
