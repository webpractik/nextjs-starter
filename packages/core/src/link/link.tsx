import clsx from 'clsx';
import NextLink, { LinkProps } from 'next/link';
import { AnchorHTMLAttributes, ReactNode } from 'react';

type BasicLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: ReactNode;
    className?: string;
} & LinkProps;

export function Link({ className, children, ...props }: BasicLinkProps) {
    return (
        <NextLink {...props} prefetch={false} className={clsx(className)}>
            {children}
        </NextLink>
    );
}
