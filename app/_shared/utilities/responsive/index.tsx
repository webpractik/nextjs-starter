import type { ReactNode } from 'react';

import {
    useDesktopMediaQuery,
    useLaptopMediaQuery,
    useMobileMediaQuery,
    useTabletMediaQuery,
} from '~/lib/hooks/use-responsive';

export function Desktop({ children }: { children: ReactNode }): ReactNode {
    const isDesktop = useDesktopMediaQuery();

    return isDesktop ? children : null;
}

export function Laptop({ children }: { children: ReactNode }): ReactNode {
    const isLaptop = useLaptopMediaQuery();

    return isLaptop ? children : null;
}

export function Tablet({ children }: { children: ReactNode }): ReactNode {
    const isTablet = useTabletMediaQuery();

    return isTablet ? children : null;
}

export function Mobile({ children }: { children: ReactNode }): ReactNode {
    const isMobile = useMobileMediaQuery();

    return isMobile ? children : null;
}
