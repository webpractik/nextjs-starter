'use client';

import { Root as Component } from '@radix-ui/react-label';
import * as React from 'react';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

import cn from './Label.module.sass';

export const Label = forwardRef<
    ElementRef<typeof Component>,
    ComponentPropsWithoutRef<typeof Component>
>(({ className, ...props }, ref) => (
    <Component ref={ref} className={`${cn.label} ${className ?? ''}`} {...props} />
));

Label.displayName = Component.displayName;
