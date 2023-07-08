'use client';

import clsx from 'clsx';
import { observer } from 'mobx-react-lite';

import cn from './TemplateName.module.sass';

type TemplateNameProps = {
    className?: string;
};

function TemplateNameComponent({ className }: TemplateNameProps) {
    return (
        <div className={clsx(cn.container, className)} data-testid="TemplateName">
            <div>New Component</div>
        </div>
    );
}

export const TemplateName = observer(TemplateNameComponent);
