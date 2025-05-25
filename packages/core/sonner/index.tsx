'use client';

import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';

const toastOptions = {
    classNames: {
        actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        description: 'group-[.toast]:text-muted-foreground',
        toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
    },
};

function Toaster({ ...props }: ToasterProps) {
    return <Sonner className="toaster group" toastOptions={toastOptions} {...props} />;
}

export { toast, Toaster };
