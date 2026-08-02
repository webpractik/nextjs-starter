import type { ComponentProps } from 'react'

import { renderToStaticMarkup } from 'react-dom/server'
import { expect, expectTypeOf, it } from 'vitest'

import { SanitizedHtml } from '.'

type SanitizedHtmlProps = ComponentProps<typeof SanitizedHtml>

type HasChildrenProp = 'children' extends keyof SanitizedHtmlProps ? true : false
type HasDangerouslySetInnerHtmlProp = 'dangerouslySetInnerHTML' extends keyof SanitizedHtmlProps
    ? true
    : false
type IsHtmlOptional = object extends Pick<SanitizedHtmlProps, 'html'> ? true : false

expectTypeOf<HasChildrenProp>().toEqualTypeOf<false>()
expectTypeOf<HasDangerouslySetInnerHtmlProp>().toEqualTypeOf<false>()
expectTypeOf<IsHtmlOptional>().toEqualTypeOf<false>()
expectTypeOf<SanitizedHtmlProps['html']>().toEqualTypeOf<string>()

it('санитизирует HTML до server render и сохраняет безопасную разметку', () => {
    const markup = renderToStaticMarkup(
        <SanitizedHtml
            html={`
                <p data-safe="true">Safe <strong>content</strong></p>
                <script>globalThis.compromised = true</script>
                <img src="x" onerror="globalThis.compromised = true">
                <a href="javascript:globalThis.compromised = true">Unsafe link</a>
            `}
        />,
    )

    expect(markup).toContain('<p data-safe="true">Safe <strong>content</strong></p>')
    expect(markup).not.toContain('<script')
    expect(markup).not.toContain('onerror')
    expect(markup).not.toContain('javascript:')
})
