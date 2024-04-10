import React, { ReactNode } from 'react';

import { Welcome } from '@/(home)/_components/welcome';

function HomeLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
            <Welcome />
            {children}
        </div>
    );
}

export default HomeLayout;
