import type { ComponentProps } from 'react'

import { sanitize } from 'isomorphic-dompurify'

export interface SanitizedHtmlProps extends Omit<
    ComponentProps<'div'>,
    'children' | 'dangerouslySetInnerHTML'
> {
    html: string
}

export function SanitizedHtml({ html, ...props }: SanitizedHtmlProps) {
    const sanitizedHtml = sanitize(html)

    // oxlint-disable-next-line react/no-danger -- DOMPurify sanitizes the only insertion value immediately above.
    return <div {...props} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
}
