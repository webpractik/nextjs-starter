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
                <div className={cn.logoWrap}>
                    <Image
                        src="/images/svg/logo.svg"
                        width={160}
                        height={160}
                        className={cn.logo}
                        alt="logo"
                    />
                </div>

                <svg viewBox="0 0 1920 300" className={cn.title}>
                    <symbol id="symbol" className={cn.symbol}>
                        <text textAnchor="middle" x="50%" y="80%">
                            NEXT STARTER
                        </text>
                    </symbol>

                    <g className="g-ants">
                        <use xlinkHref="#symbol" className={cn.textCopy} />
                        <use xlinkHref="#symbol" className={cn.textCopy} />
                        <use xlinkHref="#symbol" className={cn.textCopy} />
                        <use xlinkHref="#symbol" className={cn.textCopy} />
                        <use xlinkHref="#symbol" className={cn.textCopy} />
                    </g>
                </svg>
            </ErrorBoundary>
        </Flex>
    );
}

export default HomeComponent;
