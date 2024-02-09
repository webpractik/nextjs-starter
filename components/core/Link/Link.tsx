import clsx from 'clsx';
import Link, { LinkProps } from 'next/link';
import { AnchorHTMLAttributes, ReactNode } from 'react';

type BasicLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    children: ReactNode;
    className?: string;
} & LinkProps;

export function BasicLink({ className, children, ...props }: BasicLinkProps) {
    return (
        <Link {...props} prefetch={false} className={clsx(className)}>
            {children}
        </Link>
    );
}
