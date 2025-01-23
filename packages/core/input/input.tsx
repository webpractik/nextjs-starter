import type { InputHTMLAttributes, Ref } from 'react';

import { cn } from '../cn';

export type InputProps = {
    ref?: Ref<HTMLInputElement>;
} & InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ref, type, ...props }: InputProps) {
    return (
        <input
            className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            ref={ref}
            type={type}
            {...props}
        />
    );
}

Input.displayName = 'Input';
