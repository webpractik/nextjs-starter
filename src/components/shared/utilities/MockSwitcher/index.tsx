import React, { ReactNode, useEffect, useState } from 'react';

type MockSwitcherProps = {
    children: ReactNode;
};

function MockSwitcher({ children }: MockSwitcherProps) {
    const [isInit, setInit] = useState<boolean>(false);

    const init = async () => {
        const { initMocks } = await import('@/mocks');
        await initMocks();
        setInit(true);
    };

    useEffect(() => {
        if (process.env.NEXT_PUBLIC_MOCKS_ENABLED === 'true') {
            init().catch(console.error);
            return;
        }

        setInit(true);
    }, []);

    return <>{isInit ? children : null}</>;
}

export default MockSwitcher;
