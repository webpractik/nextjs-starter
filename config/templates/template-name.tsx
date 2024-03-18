'use client';

import { cn } from '~/lib/utils';

type TemplateNameProps = {
    className?: string;
};

export function TemplateName({ className }: TemplateNameProps) {
    return (
        <div className={cn(className)} data-testid="TemplateName">
            <div>New Component</div>
        </div>
    );
}
