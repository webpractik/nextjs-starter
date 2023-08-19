'use client';

import clsx from 'clsx';

import cn from './TemplateName.module.sass';

type TemplateNameProps = {
    className?: string;
};

export function TemplateName({ className }: TemplateNameProps) {
    return (
        <div className={clsx(cn.container, className)} data-testid="TemplateName">
            <div>New Component</div>
        </div>
    );
}
