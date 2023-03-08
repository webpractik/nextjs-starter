import { ForwardedRef, ReactElement, RefAttributes } from 'react';

declare module 'react' {
    function forwardRef<T, P = object>(
        render: (props: P, ref: ForwardedRef<T>) => ReactElement | null
    ): (props: P & RefAttributes<T>) => ReactElement | null;
}
