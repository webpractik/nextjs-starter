import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { SanitizedHtml } from '.'

it('санитизирует HTML до browser render и прокидывает props контейнера', async () => {
    const screen = await render(
        <SanitizedHtml
            aria-label="Sanitized article"
            className="prose"
            data-content-kind="article"
            html={`
                <p>Safe <strong>content</strong></p>
                <script>globalThis.compromised = true</script>
                <img src="x" onerror="globalThis.compromised = true">
                <a href="javascript:globalThis.compromised = true">Unsafe link</a>
            `}
            id="article-content"
        />,
    )
    const container = screen.getByLabelText('Sanitized article')

    await expect.element(container).toHaveClass('prose')
    await expect.element(container).toHaveAttribute('id', 'article-content')
    await expect.element(container).toHaveAttribute('data-content-kind', 'article')
    await expect.element(container.getByText('content')).toBeVisible()

    const element = container.element()

    expect(element.querySelector('script')).toBeNull()
    expect(element.querySelector('[onerror]')).toBeNull()
    expect(element.querySelector('a')?.hasAttribute('href')).toBe(false)
    expect('compromised' in globalThis).toBe(false)
})
