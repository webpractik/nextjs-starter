'use client'

import type { Route } from 'next'
import type { ComponentPropsWithoutRef } from 'react'

import { useForesight } from '@foresightjs/react'
// Единственное место адаптации Next.js Link к стратегии ForesightJS.
// oxlint-disable-next-line no-restricted-imports
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export interface ForesightLinkProps<T extends string = string> extends Omit<
    ComponentPropsWithoutRef<typeof Link>,
    'download' | 'href' | 'prefetch'
> {
    download?: boolean | string
    href: Route<T>
    prefetch?: boolean
}

export function ForesightLink<T extends string>({
    download,
    href,
    prefetch = true,
    target,
    ...props
}: ForesightLinkProps<T>) {
    const router = useRouter()
    const enabled =
        prefetch &&
        href.startsWith('/') &&
        !href.startsWith('//') &&
        (download === undefined || download === false) &&
        (target === undefined || target === '' || target === '_self')
    const { elementRef } = useForesight<HTMLAnchorElement>({
        callback: () => router.prefetch(href),
        enabled,
    })

    return (
        <Link
            {...props}
            ref={elementRef}
            href={href}
            target={target}
            download={download}
            prefetch={false}
        />
    )
}
