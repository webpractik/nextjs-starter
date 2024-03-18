import { Welcome } from 'app/(home)/_components/welcome';
import React, { ReactNode } from 'react';

function HomeLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-8">
            <Welcome />
            {children}
        </div>
    );
}

export default HomeLayout;
