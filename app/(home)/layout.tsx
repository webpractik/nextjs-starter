import { Flex } from 'core/Flex/Flex';
import React, { ReactNode } from 'react';

function HomeLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <Flex
            style={{ height: '100dvh' }}
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
        >
            {children}
        </Flex>
    );
}

export default HomeLayout;
