'use client';

import Flex from 'core/Flex';
import Image from 'next/image';
import ErrorBoundary from 'shared/utilities/ErrorBoundary';

import cn from './style.module.sass';

function HomeComponent() {
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
            </ErrorBoundary>
        </Flex>
    );
}

export default HomeComponent;
