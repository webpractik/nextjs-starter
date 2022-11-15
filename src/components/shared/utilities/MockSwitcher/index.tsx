import React, { ReactNode, useEffect, useState } from 'react';

import { initMocks } from '@/mocks';

type MockSwitcherProps = {
    children: ReactNode;
};

function MockSwitcher({ children }: MockSwitcherProps) {
    const [isInit, setInit] = useState<boolean>(false);

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_MOCKS_ENABLED !== 'true') {
            setInit(true);
            return;
        }
        initMocks()
            .then(() => {
                setInit(true);
            })
            .catch(console.error);
    }, []);

    return <>{isInit ? children : null}</>;
}

export default MockSwitcher;
