import clsx from 'clsx';
import { ComponentProps, ComponentPropsWithoutRef, forwardRef, ReactNode } from 'react';

import cn from './Grid.module.sass';

interface GridProps extends ComponentPropsWithoutRef<'div'> {
    children: ReactNode;
    columns?: number;
    gap?: string;
    className?: string;
}

export const Grid = forwardRef<HTMLDivElement, GridProps>(
    ({ className, children, columns = 3, gap = '1rem', style, ...props }: GridProps, ref) => {
        return (
            <div
                ref={ref}
                {...props}
                className={clsx(cn.grid, className)}
                style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`,
                    gridGap: `${gap}`,
                    ...style,
                }}
            >
                {children}
            </div>
        );
    }
);

Grid.displayName = 'Grid';

interface GridItemProps extends ComponentProps<'div'> {
    colSpan?: number;
    children?: ReactNode;
}

export const GridItem = ({ colSpan = 1, style, children, ...props }: GridItemProps) => {
    return (
        <div {...props} style={{ gridColumn: `span ${colSpan}`, ...style }}>
            {children}
        </div>
    );
};
