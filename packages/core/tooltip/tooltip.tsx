'use client';

import type { ComponentProps, Ref } from 'react';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '../cn';

export const TooltipProvider = TooltipPrimitive.Provider;

export const Tooltip = TooltipPrimitive.Root;

export const TooltipTrigger = TooltipPrimitive.Trigger;

type TooltipContentProps = {
    ref?: Ref<typeof TooltipPrimitive.Content>;
} & ComponentProps<typeof TooltipPrimitive.Content>;

export function TooltipContent({ className, ref, sideOffset = 4, ...props }: TooltipContentProps) {
    return (
        <TooltipPrimitive.Content
            className={cn(
                'z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                className
            )}
            ref={ref}
            sideOffset={sideOffset}
            {...props}
        />
    );
}

TooltipContent.displayName = TooltipPrimitive.Content.displayName;
