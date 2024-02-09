import { UpdateIcon } from '@radix-ui/react-icons';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import React, { ButtonHTMLAttributes, forwardRef } from 'react';

import cn from './Button.module.sass';

export const buttonVariants = cva(cn.base, {
    variants: {
        variant: {
            primary: cn.primary,
            outline: cn.outline,
            link: cn.link,
        },
        size: {
            primary: cn.primarySize,
            sm: cn.smSize,
            lg: cn.lgSize,
            icon: cn.iconSize,
        },
    },
    defaultVariants: {
        variant: 'primary',
        size: 'primary',
    },
});

export interface ButtonProps
    extends ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    loading?: boolean;
    asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, loading, children, ...props }, ref) => {
        const Component = asChild ? Slot : 'button';
        return (
            <Component
                ref={ref}
                {...props}
                disabled={loading ?? props.disabled}
                className={buttonVariants({ variant, size, className })}
            >
                {loading && (
                    <span className={cn.loader}>
                        <UpdateIcon />
                    </span>
                )}
                {children}
            </Component>
        );
    }
);

Button.displayName = 'Button';
