'use client';
// eslint-disable-next-line import/no-extraneous-dependencies
import { FlagProvider } from '@unleash/nextjs/client';
import type { ReactNode } from 'react';

import { environment } from '../../../env/client';

export const FeatureFlagProvider = ({ children }: { children: ReactNode }) => {
    return (
        <FlagProvider
            config={{
                url: `${environment.NEXT_PUBLIC_FRONT_URL}/api/feature-flag`,
            }}
        >
            {children}
        </FlagProvider>
    );
};
