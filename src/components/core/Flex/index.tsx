import clsx from 'clsx';
import { ReactNode } from 'react';

type ContainerProps = {
    flexDirection: 'row' | 'row-reverse' | 'column' | 'column-reverse';
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
    flex: string;
    gap: string;
    margin: string;
    width: string;
};

type FlexProps = {
    children?: ReactNode;
    className?: string;
} & Partial<ContainerProps>;

function Flex({
    children,
    className,
    alignItems,
    flexWrap = 'nowrap',
    flexDirection = 'row',
    justifyContent,
    flex,
    gap,
    width,
    margin,
}: FlexProps) {
    return (
        <div
            className={clsx(className, 'flex', {
                flexDirectionColumn: flexDirection === 'column',
                flexDirectionColumnReverse: flexDirection === 'column-reverse',
                flexDirectionRow: flexDirection === 'row',
                flexDirectionRowReverse: flexDirection === 'row-reverse',
                flexWrapNowrap: flexWrap === 'nowrap',
                flexWrapWrap: flexWrap === 'wrap',
                flexWrapWrapReverse: flexWrap === 'wrap-reverse',
                alignItemsFlexStart: alignItems === 'flex-start',
                alignItemsFlexEnd: alignItems === 'flex-end',
                alignItemsCenter: alignItems === 'center',
                alignItemsStretch: alignItems === 'stretch',
                alignItemsBaseline: alignItems === 'baseline',
                justifyContentFlexStart: justifyContent === 'flex-start',
                justifyContentFlexEnd: justifyContent === 'flex-end',
                justifyContentCenter: justifyContent === 'center',
                justifyContentSpaceAround: justifyContent === 'space-around',
                justifyContentSpaceBetween: justifyContent === 'space-between',
            })}
            style={{
                flex,
                gap,
                width,
                margin,
            }}
        >
            {children}
        </div>
    );
}

export default Flex;
