'use client';

import type { ComponentProps, Ref } from 'react';

import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../cn';

const labelVariants = cva(
    'text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

type LabelProps = {
    ref?: Ref<typeof LabelPrimitive.Root>;
} & ComponentProps<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>;

export function Label({ className, ref, ...props }: LabelProps) {
    return <LabelPrimitive.Root className={cn(labelVariants(), className)} ref={ref} {...props} />;
}

Label.displayName = LabelPrimitive.Root.displayName;
