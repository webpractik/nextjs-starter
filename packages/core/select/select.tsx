'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import type { ComponentProps, Ref } from 'react';

import { cn } from '../cn';

export const Select = SelectPrimitive.Root;

export const SelectGroup = SelectPrimitive.Group;

export const SelectValue = SelectPrimitive.Value;

type SelectTriggerProps = ComponentProps<typeof SelectPrimitive.Trigger> & {
    ref?: Ref<typeof SelectPrimitive.Trigger>;
};

export const SelectTrigger = ({ className, children, ref, ...props }: SelectTriggerProps) => (
    <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
            className
        )}
        {...props}
    >
        {children}
        <SelectPrimitive.Icon asChild>
            <ChevronDown className="size-4 opacity-50" />
        </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
);

SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

type SelectScrollUpButtonProps = ComponentProps<typeof SelectPrimitive.ScrollUpButton> & {
    ref?: Ref<typeof SelectPrimitive.ScrollUpButton>;
};

export const SelectScrollUpButton = ({ className, ref, ...props }: SelectScrollUpButtonProps) => (
    <SelectPrimitive.ScrollUpButton
        ref={ref}
        className={cn('flex cursor-default items-center justify-center py-1', className)}
        {...props}
    >
        <ChevronUp className="size-4" />
    </SelectPrimitive.ScrollUpButton>
);

SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

type SelectScrollDownButtonProps = ComponentProps<typeof SelectPrimitive.ScrollDownButton> & {
    ref?: Ref<typeof SelectPrimitive.ScrollDownButton>;
};

export const SelectScrollDownButton = ({
    className,
    ref,
    ...props
}: SelectScrollDownButtonProps) => (
    <SelectPrimitive.ScrollDownButton
        ref={ref}
        className={cn('flex cursor-default items-center justify-center py-1', className)}
        {...props}
    >
        <ChevronDown className="size-4" />
    </SelectPrimitive.ScrollDownButton>
);

SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

type SelectContentProps = ComponentProps<typeof SelectPrimitive.Content> & {
    ref?: Ref<typeof SelectPrimitive.Content>;
};

export const SelectContent = ({
    className,
    children,
    ref,
    position = 'popper',
    ...props
}: SelectContentProps) => (
    <SelectPrimitive.Portal>
        <SelectPrimitive.Content
            ref={ref}
            position={position}
            className={cn(
                'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                position === 'popper' &&
                    'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
                className
            )}
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

SelectContent.displayName = SelectPrimitive.Content.displayName;

type SelectLabelProps = ComponentProps<typeof SelectPrimitive.Label> & {
    ref?: Ref<typeof SelectPrimitive.Label>;
};

export const SelectLabel = ({ className, ref, ...props }: SelectLabelProps) => (
    <SelectPrimitive.Label
        ref={ref}
        className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
        {...props}
    />
);

SelectLabel.displayName = SelectPrimitive.Label.displayName;

type SelectItemProps = ComponentProps<typeof SelectPrimitive.Item> & {
    ref?: Ref<typeof SelectPrimitive.Item>;
};

export const SelectItem = ({ className, ref, children, ...props }: SelectItemProps) => (
    <SelectPrimitive.Item
        ref={ref}
        className={cn(
            'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
            className
        )}
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

SelectItem.displayName = SelectPrimitive.Item.displayName;

type SelectSeparatorProps = ComponentProps<typeof SelectPrimitive.Separator> & {
    ref?: Ref<typeof SelectPrimitive.Separator>;
};

export const SelectSeparator = ({ className, ref, ...props }: SelectSeparatorProps) => (
    <SelectPrimitive.Separator
        ref={ref}
        className={cn('-mx-1 my-1 h-px bg-muted', className)}
        {...props}
    />
);

SelectSeparator.displayName = SelectPrimitive.Separator.displayName;
