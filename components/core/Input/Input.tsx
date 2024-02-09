import React, { forwardRef, InputHTMLAttributes } from 'react';

import cn from './Input.module.sass';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input ref={ref} type={type} className={`${cn.input} ${className ?? ''}`} {...props} />
        );
    }
);

Input.displayName = 'Input';
