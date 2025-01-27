import type { ButtonHTMLAttributes, Ref } from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';

import { cn } from '../cn.ts';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md text-sm font-medium whitespace-nowrap ring-offset-background transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50',
    {
        defaultVariants: {
            size: 'default',
            variant: 'default',
        },
        variants: {
            size: {
                default: 'h-10 px-4 py-2',
                icon: 'size-10',
                lg: 'h-11 rounded-md px-8',
                sm: 'h-9 rounded-md px-3',
            },
            variant: {
                default: 'bg-primary text-primary-foreground hover:bg-primary/90',
                destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
                ghost: 'hover:bg-accent hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
                outline:
                    'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
                secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
            },
        },
    }
);

export type ButtonProps = {
    asChild?: boolean;
    loading?: boolean;
    ref?: Ref<HTMLButtonElement>;
} & ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof buttonVariants>;

function Button({
    asChild = false,
    children,
    className,
    loading,
    ref,
    size,
    type,
    variant,
    ...props
}: Readonly<ButtonProps>) {
    if (asChild) {
        return <Slot {...props}>{children}</Slot>;
    }

    return (
        <button
            className={cn(buttonVariants({ className, size, variant }))}
            disabled={loading ?? props.disabled}
            ref={ref}
            type={type ?? 'button'}
            {...props}
        >
            {loading ? (
                <span className="mr-1 animate-spin">
                    <LoaderCircle size={15} />
                </span>
            ) : null}
            {children}
        </button>
    );
}

Button.displayName = 'Button';

export { Button, buttonVariants };
