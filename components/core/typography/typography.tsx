import { cva } from 'class-variance-authority';
import React, { ComponentProps, forwardRef, ReactNode } from 'react';

import cn from './typography.module.sass';

export const typographyVariants = cva(cn.base, {
    variants: {
        variant: {
            h1: cn.h1,
            h2: cn.h2,
            h3: cn.h3,
            h4: cn.h4,
            h5: cn.h5,
            h6: cn.h6,
            p: cn.text,
            span: '',
        },
        color: {
            primary: cn.primary,
            secondary: cn.secondary,
        },
        center: {
            true: cn.center,
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
}

export const Typography = forwardRef<HTMLParagraphElement, TypographyProps>(
    (
        { variant = 'p', color, center, className = '', children, ...props }: TypographyProps,
        ref
    ) => {
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
    }
);

Typography.displayName = 'Typography';
