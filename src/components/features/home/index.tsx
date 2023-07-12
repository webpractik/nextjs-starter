'use client';

import Flex from 'core/Flex';
import Logo from 'features/home/Logo';
import SvgTitle from 'features/home/SvgTitle';
import ErrorBoundary from 'shared/utilities/ErrorBoundary';

import cn from './style.module.sass';

function HomeComponent() {
    return (
        <Flex
            className={cn.container}
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
        >
            <ErrorBoundary>
                <Logo />
                <SvgTitle />
            </ErrorBoundary>
        </Flex>
    );
}

export default HomeComponent;
