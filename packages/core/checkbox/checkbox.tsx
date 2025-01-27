'use client';

import type { ComponentProps, Ref } from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';

import { cn } from '../cn';

type CheckboxProps = {
    ref?: Ref<typeof CheckboxPrimitive.Root>;
} & ComponentProps<typeof CheckboxPrimitive.Root>;

export function Checkbox({ className, ref, ...props }: CheckboxProps) {
    return (
        <CheckboxPrimitive.Root
            className={cn(
                'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
                className
            )}
            ref={ref}
            {...props}
        >
            <CheckboxPrimitive.Indicator
                className={cn('flex items-center justify-center text-current')}
            >
                <Check className="size-4" data-testid="check-icon" />
            </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}

Checkbox.displayName = CheckboxPrimitive.Root.displayName;
