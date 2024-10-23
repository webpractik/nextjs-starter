import { useMedia } from 'react-use';

export function useMobileMediaQuery() {
    return useMedia('(min-width: 320px)', true);
}

export function useTabletMediaQuery() {
    return useMedia('(min-width: 768px)', false);
}

export function useLaptopMediaQuery() {
    return useMedia('(min-width: 1024px)', false);
}

export function useDesktopMediaQuery() {
    return useMedia('(min-width: 1280px)', false);
}

export function useBreakpoints() {
    const gtMobile = useMobileMediaQuery();
    const gtTablet = useTabletMediaQuery();
    const gtLaptop = useLaptopMediaQuery();
    const gtDesktop = useDesktopMediaQuery();

    return {
        gtMobile,
        gtTablet,
        gtLaptop,
        gtDesktop,
    };
}
