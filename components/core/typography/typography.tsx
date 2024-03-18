import { cva } from 'class-variance-authority';
import React, { ComponentProps, forwardRef, ReactNode } from 'react';

import styles from './typography.module.css';

export const typographyVariants = cva(styles.base, {
    variants: {
        variant: {
            h1: styles.h1,
            h2: styles.h2,
            h3: styles.h3,
            h4: styles.h4,
            h5: styles.h5,
            h6: styles.h6,
            p: styles.text,
            span: '',
        },
        color: {
            primary: styles.primary,
            secondary: styles.secondary,
        },
        center: {
            true: styles.center,
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
