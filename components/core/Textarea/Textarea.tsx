import React, { forwardRef, TextareaHTMLAttributes } from 'react';

import cn from './Textarea.module.sass';
export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, ...props }, ref) => {
        return <textarea ref={ref} {...props} className={`${cn.textarea} ${className ?? ''}`} />;
    }
);

Textarea.displayName = 'Textarea';
