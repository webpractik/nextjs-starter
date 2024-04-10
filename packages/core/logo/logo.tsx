import Image from 'next/image';

export function Logo() {
    return <Image priority src="/images/svg/logo.svg" width={300} height={100} alt="logo" />;
}
