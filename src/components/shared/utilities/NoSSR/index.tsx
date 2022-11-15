import React, { ReactNode } from 'react';
import { useMountedState } from 'react-use';

type NoSSRProps = {
    children: ReactNode;
    fallback?: ReactNode;
};

function NoSSR({ children, fallback = null }: NoSSRProps) {
    const isMounted = useMountedState();

    return <>{isMounted() ? children : fallback}</>;
}

export default NoSSR;
