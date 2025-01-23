'use client';

import type { ComponentProps, Ref } from 'react';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';

import { cn } from '../cn';

type RadioGroupProps = {
    ref?: Ref<typeof RadioGroupPrimitive.Root>;
} & ComponentProps<typeof RadioGroupPrimitive.Root>;

export function RadioGroup({ className, ref, ...props }: RadioGroupProps) {
    return (
        <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />
    );
}

RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

type RadioGroupItemProps = {
    ref?: Ref<typeof RadioGroupPrimitive.Item>;
} & ComponentProps<typeof RadioGroupPrimitive.Item>;

export function RadioGroupItem({ className, ref, ...props }: RadioGroupItemProps) {
    return (
        <RadioGroupPrimitive.Item
            className={cn(
                'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            ref={ref}
            {...props}
        >
            <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                <Circle className="size-2.5 fill-current text-current" />
            </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
    );
}

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
