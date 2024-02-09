import { Slot } from '@radix-ui/react-slot';
import clsx from 'clsx';
import { ComponentProps, forwardRef, ReactNode } from 'react';

type ContainerProps = {
    direction: 'row' | 'row-reverse' | 'column' | 'column-reverse';
    wrap: 'wrap' | 'nowrap' | 'wrap-reverse';
    justifyContent:
        | 'flex-start'
        | 'flex-end'
        | 'center'
        | 'space-between'
        | 'space-around'
        | 'initial'
        | 'inherit';
    alignItems:
        | 'stretch'
        | 'center'
        | 'flex-start'
        | 'flex-end'
        | 'baseline'
        | 'initial'
        | 'inherit';
    /* Common Props */
    flex: string;
    gap: string;
    margin: string;
    width: string;
    center: boolean;
    column: boolean;
};

interface BoxProps extends Partial<ContainerProps>, ComponentProps<'div'> {
    asChild?: boolean;
    children?: ReactNode;
    className?: string;
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(
    (
        {
            asChild,
            children,
            className,
            alignItems,
            wrap = 'nowrap',
            direction = 'row',
            justifyContent,
            flex,
            gap,
            width,
            margin,
            center = false,
            column = false,
            style,
            ...props
        },
        ref
    ) => {
        const Component = asChild ? Slot : 'div';

        const classNames = {
            flexDirectionColumn: column || direction === 'column',
            flexDirectionColumnReverse: direction === 'column-reverse',
            flexDirectionRow: direction === 'row',
            flexDirectionRowReverse: direction === 'row-reverse',
            flexWrapNowrap: wrap === 'nowrap',
            flexWrapWrap: wrap === 'wrap',
            flexWrapWrapReverse: wrap === 'wrap-reverse',
            alignItemsFlexStart: alignItems === 'flex-start',
            alignItemsFlexEnd: alignItems === 'flex-end',
            alignItemsCenter: center || alignItems === 'center',
            alignItemsStretch: alignItems === 'stretch',
            alignItemsBaseline: alignItems === 'baseline',
            justifyContentFlexStart: justifyContent === 'flex-start',
            justifyContentFlexEnd: justifyContent === 'flex-end',
            justifyContentCenter: center || justifyContent === 'center',
            justifyContentSpaceAround: justifyContent === 'space-around',
            justifyContentSpaceBetween: justifyContent === 'space-between',
        };

        return (
            <Component
                {...props}
                ref={ref}
                className={clsx('flex', classNames, className)}
                style={{ flex, gap, width, margin, ...style }}
            >
                {children}
            </Component>
        );
    }
);

Box.displayName = 'Box';
