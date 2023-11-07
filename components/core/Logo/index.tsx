import Image from 'next/image';
import React from 'react';

import cn from './style.module.sass';

function Logo() {
    return (
        <div className={cn.container}>
            <Image
                priority
                src="/images/svg/logo.svg"
                width={160}
                height={160}
                className={cn.logo}
                alt="logo"
            />
        </div>
    );
}

export default Logo;
