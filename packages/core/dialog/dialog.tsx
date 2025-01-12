'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ComponentProps, HTMLAttributes, Ref } from 'react';
import * as React from 'react';

import { cn } from '../cn';

export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogPortal = DialogPrimitive.Portal;

export const DialogClose = DialogPrimitive.Close;

type DialogOverlayProps = ComponentProps<typeof DialogPrimitive.Overlay> & {
    ref?: Ref<typeof DialogPrimitive.Overlay>;
};

export const DialogOverlay = ({ className, ref, ...props }: DialogOverlayProps) => (
    <DialogPrimitive.Overlay
        ref={ref}
        className={cn(
            'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            className
        )}
        {...props}
    />
);

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentProps = ComponentProps<typeof DialogPrimitive.Content> & {
    ref?: Ref<typeof DialogPrimitive.Content>;
};

export const DialogContent = ({ className, ref, children, ...props }: DialogContentProps) => (
    <DialogPortal>
        <DialogOverlay />
        <DialogPrimitive.Content
            ref={ref}
            className={cn(
                'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
                className
            )}
            {...props}
        >
            {children}
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                <X className="size-4" />
                <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
        </DialogPrimitive.Content>
    </DialogPortal>
);

DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
        {...props}
    />
);

DialogHeader.displayName = 'DialogHeader';

export const DialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
    <div
        className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
        {...props}
    />
);

DialogFooter.displayName = 'DialogFooter';

type DialogTitleProps = ComponentProps<typeof DialogPrimitive.Title> & {
    ref?: Ref<typeof DialogPrimitive.Title>;
};

export const DialogTitle = ({ className, ref, ...props }: DialogTitleProps) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn('text-lg font-semibold leading-none tracking-tight', className)}
        {...props}
    />
);

DialogTitle.displayName = DialogPrimitive.Title.displayName;

type DialogDescriptionProps = ComponentProps<typeof DialogPrimitive.Description> & {
    ref?: Ref<typeof DialogPrimitive.Description>;
};

export const DialogDescription = ({ className, ref, ...props }: DialogDescriptionProps) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn('text-sm text-muted-foreground', className)}
        {...props}
    />
);

DialogDescription.displayName = DialogPrimitive.Description.displayName;
