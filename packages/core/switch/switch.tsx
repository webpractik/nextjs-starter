'use client';

import type { ComponentProps, Ref } from 'react';

import * as SwitchPrimitives from '@radix-ui/react-switch';

import { cn } from '../cn';

type SwitchProps = {
    ref?: Ref<typeof SwitchPrimitives.Root>;
} & ComponentProps<typeof SwitchPrimitives.Root>;

export function Switch({ className, ref, ...props }: SwitchProps) {
    return (
        <SwitchPrimitives.Root
            className={cn(
                'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input',
                className
            )}
            {...props}
            ref={ref}
        >
            <SwitchPrimitives.Thumb
                className={cn(
                    'pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
                )}
            />
        </SwitchPrimitives.Root>
    );
}

Switch.displayName = SwitchPrimitives.Root.displayName;
