import Flex from 'core/Flex';
import Image from 'next/image';
import React from 'react';
import ErrorBoundary from 'shared/utilities/ErrorBoundary';

import { useHello } from '@/queries/hello';

import cn from './style.module.sass';

function HomeComponent() {
    const { data, isLoading, isError } = useHello();

    return (
        <Flex
            className={cn.glow}
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
        >
            <ErrorBoundary>
                <Image src="/images/svg/logo.svg" width={100} height={100} alt="logo" />
                <div className={cn.wrapper}>NextJS Starter</div>

                {!isLoading && !isError && <div className={cn.result}>{data.result}</div>}
            </ErrorBoundary>
        </Flex>
    );
}

export default HomeComponent;
