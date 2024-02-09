'use client';

import { Indicator, Item, Root as Component } from '@radix-ui/react-radio-group';
import clsx from 'clsx';
import { ComponentPropsWithoutRef, ElementRef, forwardRef } from 'react';

import cn from './RadioGroup.module.sass';
export const RadioGroup = forwardRef<
    ElementRef<typeof Component>,
    ComponentPropsWithoutRef<typeof Component>
>(({ className, ...props }, ref) => {
    return <Component ref={ref} className={clsx(cn.radioGroup, className)} {...props} />;
});

RadioGroup.displayName = Component.displayName;

export const RadioGroupItem = forwardRef<
    ElementRef<typeof Item>,
    ComponentPropsWithoutRef<typeof Item>
>(({ className, ...props }, ref) => {
    return (
        <Item ref={ref} className={clsx(cn.radioItem, className)} {...props}>
            <Indicator className={cn.indicator} />
        </Item>
    );
});

RadioGroupItem.displayName = Item.displayName;
