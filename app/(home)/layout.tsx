import Flex from 'core/Flex';
import React, { ReactNode } from 'react';

import cn from '@/(home)/_components/style.module.sass';

function HomeLayout({ children }: { children: ReactNode }) {
    return (
        <Flex
            className={cn.container}
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
        >
            {children}
        </Flex>
    );
}

export default HomeLayout;
