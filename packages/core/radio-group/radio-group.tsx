'use client';

import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import type { ComponentProps, Ref } from 'react';

import { cn } from '../cn';

type RadioGroupProps = ComponentProps<typeof RadioGroupPrimitive.Root> & {
    ref?: Ref<typeof RadioGroupPrimitive.Root>;
};

export const RadioGroup = ({ className, ref, ...props }: RadioGroupProps) => {
    return (
        <RadioGroupPrimitive.Root className={cn('grid gap-2', className)} {...props} ref={ref} />
    );
};

RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

type RadioGroupItemProps = ComponentProps<typeof RadioGroupPrimitive.Item> & {
    ref?: Ref<typeof RadioGroupPrimitive.Item>;
};

export const RadioGroupItem = ({ className, ref, ...props }: RadioGroupItemProps) => {
    return (
        <RadioGroupPrimitive.Item
            ref={ref}
            className={cn(
                'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className
            )}
            {...props}
        >
            <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
                <Circle className="size-2.5 fill-current text-current" />
            </RadioGroupPrimitive.Indicator>
        </RadioGroupPrimitive.Item>
    );
};

RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;
