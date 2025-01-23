'use client';

import type { ComponentProps, Ref } from 'react';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '../cn';

export const Select = SelectPrimitive.Root;

export const SelectGroup = SelectPrimitive.Group;

export const SelectValue = SelectPrimitive.Value;

type SelectTriggerProps = {
    ref?: Ref<typeof SelectPrimitive.Trigger>;
} & ComponentProps<typeof SelectPrimitive.Trigger>;

export function SelectTrigger({ children, className, ref, ...props }: SelectTriggerProps) {
    return (
        <SelectPrimitive.Trigger
            className={cn(
                'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
                className
            )}
            ref={ref}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon asChild>
                <ChevronDown className="size-4 opacity-50" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

type SelectScrollUpButtonProps = {
    ref?: Ref<typeof SelectPrimitive.ScrollUpButton>;
} & ComponentProps<typeof SelectPrimitive.ScrollUpButton>;

export function SelectScrollUpButton({ className, ref, ...props }: SelectScrollUpButtonProps) {
    return (
        <SelectPrimitive.ScrollUpButton
            className={cn('flex cursor-default items-center justify-center py-1', className)}
            ref={ref}
            {...props}
        >
            <ChevronUp className="size-4" />
        </SelectPrimitive.ScrollUpButton>
    );
}

SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

type SelectScrollDownButtonProps = {
    ref?: Ref<typeof SelectPrimitive.ScrollDownButton>;
} & ComponentProps<typeof SelectPrimitive.ScrollDownButton>;

export function SelectScrollDownButton({ className, ref, ...props }: SelectScrollDownButtonProps) {
    return (
        <SelectPrimitive.ScrollDownButton
            className={cn('flex cursor-default items-center justify-center py-1', className)}
            ref={ref}
            {...props}
        >
            <ChevronDown className="size-4" />
        </SelectPrimitive.ScrollDownButton>
    );
}

SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

type SelectContentProps = {
    ref?: Ref<typeof SelectPrimitive.Content>;
} & ComponentProps<typeof SelectPrimitive.Content>;

export function SelectContent({
    children,
    className,
    position = 'popper',
    ref,
    ...props
}: SelectContentProps) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content
                className={cn(
                    'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                    position === 'popper' &&
                        'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
                    className
                )}
                position={position}
                ref={ref}
                {...props}
            >
                <SelectScrollUpButton />
                <SelectPrimitive.Viewport
                    className={cn(
                        'p-1',
                        position === 'popper' &&
                            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
                    )}
                >
                    {children}
                </SelectPrimitive.Viewport>
                <SelectScrollDownButton />
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

SelectContent.displayName = SelectPrimitive.Content.displayName;

type SelectLabelProps = {
    ref?: Ref<typeof SelectPrimitive.Label>;
} & ComponentProps<typeof SelectPrimitive.Label>;

export function SelectLabel({ className, ref, ...props }: SelectLabelProps) {
    return (
        <SelectPrimitive.Label
            className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
            ref={ref}
            {...props}
        />
    );
}

SelectLabel.displayName = SelectPrimitive.Label.displayName;

type SelectItemProps = {
    ref?: Ref<typeof SelectPrimitive.Item>;
} & ComponentProps<typeof SelectPrimitive.Item>;

export function SelectItem({ children, className, ref, ...props }: SelectItemProps) {
    return (
        <SelectPrimitive.Item
            className={cn(
                'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-hidden focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
                className
            )}
            ref={ref}
            {...props}
        >
            <span className="absolute left-2 flex size-3.5 items-center justify-center">
                <SelectPrimitive.ItemIndicator>
                    <Check className="size-4" />
                </SelectPrimitive.ItemIndicator>
            </span>

            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

SelectItem.displayName = SelectPrimitive.Item.displayName;

type SelectSeparatorProps = {
    ref?: Ref<typeof SelectPrimitive.Separator>;
} & ComponentProps<typeof SelectPrimitive.Separator>;

export function SelectSeparator({ className, ref, ...props }: SelectSeparatorProps) {
    return (
        <SelectPrimitive.Separator
            className={cn('-mx-1 my-1 h-px bg-muted', className)}
            ref={ref}
            {...props}
        />
    );
}

SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
