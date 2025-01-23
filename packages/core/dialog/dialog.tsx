'use client';

import type { ComponentProps, HTMLAttributes, Ref } from 'react';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '../cn';

export const Dialog = DialogPrimitive.Root;

export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogPortal = DialogPrimitive.Portal;

export const DialogClose = DialogPrimitive.Close;

type DialogOverlayProps = {
    ref?: Ref<typeof DialogPrimitive.Overlay>;
} & ComponentProps<typeof DialogPrimitive.Overlay>;

export function DialogOverlay({ className, ref, ...props }: DialogOverlayProps) {
    return (
        <DialogPrimitive.Overlay
            className={cn(
                'fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                className
            )}
            ref={ref}
            {...props}
        />
    );
}

DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

type DialogContentProps = {
    ref?: Ref<typeof DialogPrimitive.Content>;
} & ComponentProps<typeof DialogPrimitive.Content>;

export function DialogContent({ children, className, ref, ...props }: DialogContentProps) {
    return (
        <DialogPortal>
            <DialogOverlay />
            <DialogPrimitive.Content
                className={cn(
                    'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
                    className
                )}
                ref={ref}
                {...props}
            >
                {children}
                <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-hidden focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
                    <X className="size-4" />
                    <span className="sr-only">Close</span>
                </DialogPrimitive.Close>
            </DialogPrimitive.Content>
        </DialogPortal>
    );
}

DialogContent.displayName = DialogPrimitive.Content.displayName;

export function DialogHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn('flex flex-col space-y-1.5 text-center sm:text-left', className)}
            {...props}
        />
    );
}

DialogHeader.displayName = 'DialogHeader';

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2',
                className
            )}
            {...props}
        />
    );
}

DialogFooter.displayName = 'DialogFooter';

type DialogTitleProps = {
    ref?: Ref<typeof DialogPrimitive.Title>;
} & ComponentProps<typeof DialogPrimitive.Title>;

export function DialogTitle({ className, ref, ...props }: DialogTitleProps) {
    return (
        <DialogPrimitive.Title
            className={cn('text-lg font-semibold leading-none tracking-tight', className)}
            ref={ref}
            {...props}
        />
    );
}

DialogTitle.displayName = DialogPrimitive.Title.displayName;

type DialogDescriptionProps = {
    ref?: Ref<typeof DialogPrimitive.Description>;
} & ComponentProps<typeof DialogPrimitive.Description>;

export function DialogDescription({ className, ref, ...props }: DialogDescriptionProps) {
    return (
        <DialogPrimitive.Description
            className={cn('text-sm text-muted-foreground', className)}
            ref={ref}
            {...props}
        />
    );
}

DialogDescription.displayName = DialogPrimitive.Description.displayName;
