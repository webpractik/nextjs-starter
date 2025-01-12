import type { InputHTMLAttributes, Ref } from 'react';

import { cn } from '../cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    ref?: Ref<HTMLInputElement>;
}

export const Input = ({ className, ref, type, ...props }: InputProps) => {
    return (
        <input
            ref={ref}
            type={type}
            className={cn(
                'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        />
    );
};

Input.displayName = 'Input';
