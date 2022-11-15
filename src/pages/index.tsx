import Image from 'next/image';
import React from 'react';

import Flex from '@/components/core/Flex';
import ErrorBoundary from '@/components/shared/utilities/ErrorBoundary';
import { useHello } from '@/hooks/queries/hello';

function IndexPage() {
    const { data, isLoading, isError } = useHello();

    return (
        <Flex className="glow" alignItems="center" justifyContent="center" flexDirection="column">
            <ErrorBoundary>
                <Image src="/images/svg/logo.svg" width={100} height={100} alt="logo" />
                <div>NextJS Starter</div>

                {!isLoading && !isError && <div className="result">{data.result}</div>}
            </ErrorBoundary>
        </Flex>
    );
}

export default IndexPage;
