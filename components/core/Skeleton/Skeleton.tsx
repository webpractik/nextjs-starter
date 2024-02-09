import { HTMLAttributes } from 'react';

import cn from './Skeleton.module.sass';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
    return <div className={`${cn.skeleton} ${className}`} {...props} />;
}
