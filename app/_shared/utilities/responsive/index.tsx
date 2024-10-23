import { ReactNode } from 'react';

import {
    useDesktopMediaQuery,
    useLaptopMediaQuery,
    useMobileMediaQuery,
    useTabletMediaQuery,
} from '~/lib/hooks/use-responsive';

// eslint-disable-next-line sonarjs/function-return-type
export function Desktop({ children }: { children: ReactNode }): ReactNode {
    const isDesktop = useDesktopMediaQuery();

    return isDesktop ? children : null;
}

// eslint-disable-next-line sonarjs/function-return-type
export function Laptop({ children }: { children: ReactNode }): ReactNode {
    const isLaptop = useLaptopMediaQuery();

    return isLaptop ? children : null;
}

// eslint-disable-next-line sonarjs/function-return-type
export function Tablet({ children }: { children: ReactNode }): ReactNode {
    const isTablet = useTabletMediaQuery();

    return isTablet ? children : null;
}

// eslint-disable-next-line sonarjs/function-return-type
export function Mobile({ children }: { children: ReactNode }): ReactNode {
    const isMobile = useMobileMediaQuery();

    return isMobile ? children : null;
}
