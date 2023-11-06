import React, { ReactNode } from 'react';

import cn from '@/(home)/_components/style.module.sass';
import Flex from '@/components/core/Flex';

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
