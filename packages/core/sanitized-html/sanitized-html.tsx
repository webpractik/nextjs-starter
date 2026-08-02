import type { ComponentProps } from 'react'

import DOMPurify from 'isomorphic-dompurify'

export interface SanitizedHtmlProps extends Omit<
    ComponentProps<'div'>,
    'children' | 'dangerouslySetInnerHTML'
> {
    html: string
}

export function SanitizedHtml({ html, ...props }: SanitizedHtmlProps) {
    const sanitizedHtml = DOMPurify.sanitize(html)

    // oxlint-disable-next-line react-dom/no-dangerously-set-innerhtml -- DOMPurify sanitizes the only insertion value immediately above.
    return <div {...props} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
}
