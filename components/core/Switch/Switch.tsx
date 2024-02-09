'use client';

import { Root as Component, Thumb } from '@radix-ui/react-switch';
import clsx from 'clsx';
import React, { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

import cn from './Switch.module.sass';
export const Switch = forwardRef<
    ElementRef<typeof Component>,
    ComponentPropsWithoutRef<typeof Component>
>(({ className, ...props }, ref) => (
    <Component className={clsx(cn.switch, className)} {...props} ref={ref}>
        <Thumb className={clsx(cn.thumb)} />
    </Component>
));

Switch.displayName = Component.displayName;
