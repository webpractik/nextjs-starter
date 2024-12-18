import React, { ReactNode } from 'react';

function HomeLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <div className="bg-grid-white/[0.02] relative flex size-full h-dvh min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-black/[0.96] antialiased">
            {children}
        </div>
    );
}

export default HomeLayout;
