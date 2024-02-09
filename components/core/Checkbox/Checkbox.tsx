'use client';

import { Indicator, Root as Component } from '@radix-ui/react-checkbox';
import { CheckIcon } from '@radix-ui/react-icons';
import clsx from 'clsx';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

import cn from './Checkbox.module.sass';

export const Checkbox = forwardRef<
    ElementRef<typeof Component>,
    ComponentPropsWithoutRef<typeof Component>
>(({ className, ...props }, ref) => (
    <Component ref={ref} className={clsx(cn.checkbox, className)} {...props}>
        <Indicator className={cn.indicator}>
            <CheckIcon className={cn.checkIcon} data-testid="check-icon" />
        </Indicator>
    </Component>
));

Checkbox.displayName = Component.displayName;
