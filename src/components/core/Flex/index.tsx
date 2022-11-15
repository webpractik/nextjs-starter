import React, { ReactNode } from 'react';

type ContainerProps = {
    flex: string;
    gap: string;
    flexDirection: 'row' | 'column';
    flexWrap: 'wrap' | 'nowrap' | 'wrap-reverse';
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
    padding: string;
    margin: string;
    width: string;
    height: string;
};

type FlexProps = {
    children?: ReactNode;
    className?: string;
} & Partial<ContainerProps>;

function Flex({
    children,
    className,
    alignItems = 'stretch',
    flexWrap = 'nowrap',
    flexDirection = 'row',
    justifyContent = 'flex-start',
    flex = '0 1 auto',
    gap = '0px',
    width = 'inherit',
    height = 'inherit',
    margin = '0px',
    padding = '0px',
}: FlexProps) {
    return (
        <div
            className={className}
            style={{
                display: 'flex',
                alignItems,
                justifyContent,
                flexWrap,
                flexDirection,
                flex,
                gap,
                width,
                height,
                margin,
                padding,
            }}
        >
            {children}
        </div>
    );
}

export default Flex;
