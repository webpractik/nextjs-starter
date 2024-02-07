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
    asChild?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Component = asChild ? Slot : 'button';
        return (
            <Component
                ref={ref}
                className={buttonVariants({ variant, size, className })}
                {...props}
            />
        );
    }
);

Button.displayName = 'Button';
