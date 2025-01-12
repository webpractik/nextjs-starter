'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, Ref } from 'react';

import { cn } from '../cn';

const labelVariants = cva(
    'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

type LabelProps = ComponentProps<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants> & {
        ref?: Ref<typeof LabelPrimitive.Root>;
    };

export const Label = ({ className, ref, ...props }: LabelProps) => (
    <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
);

Label.displayName = LabelPrimitive.Root.displayName;
