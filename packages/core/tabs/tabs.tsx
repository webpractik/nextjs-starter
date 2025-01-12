'use client';

import * as TabsPrimitive from '@radix-ui/react-tabs';
import type { ComponentProps, Ref } from 'react';

import { cn } from '../cn';

export const Tabs = TabsPrimitive.Root;

type TabsListProps = ComponentProps<typeof TabsPrimitive.List> & {
    ref?: Ref<typeof TabsPrimitive.List>;
};

export const TabsList = ({ className, ref, ...props }: TabsListProps) => (
    <TabsPrimitive.List
        ref={ref}
        className={cn(
            'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
            className
        )}
        {...props}
    />
);

TabsList.displayName = TabsPrimitive.List.displayName;

type TabsTriggerProps = ComponentProps<typeof TabsPrimitive.Trigger> & {
    ref?: Ref<typeof TabsPrimitive.Trigger>;
};

export const TabsTrigger = ({ className, ref, ...props }: TabsTriggerProps) => (
    <TabsPrimitive.Trigger
        ref={ref}
        className={cn(
            'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
            className
        )}
        {...props}
    />
);

TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

type TabsContentProps = ComponentProps<typeof TabsPrimitive.Content> & {
    ref?: Ref<typeof TabsPrimitive.Content>;
};

export const TabsContent = ({ className, ref, ...props }: TabsContentProps) => (
    <TabsPrimitive.Content
        ref={ref}
        className={cn(
            'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            className
        )}
        {...props}
    />
);

TabsContent.displayName = TabsPrimitive.Content.displayName;
