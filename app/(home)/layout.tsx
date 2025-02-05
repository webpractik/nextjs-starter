import type { ReactNode } from 'react';

function HomeLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <div className="relative flex size-full h-dvh min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden antialiased">
            {children}
        </div>
    );
}

export default HomeLayout;
