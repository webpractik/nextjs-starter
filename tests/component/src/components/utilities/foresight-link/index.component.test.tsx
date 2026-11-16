import { ForesightManager } from '@foresightjs/react'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { nextRouterMock } from '#/tests/mocks/next-navigation'

import { ForesightLink } from '../../../../../../src/components/utilities/foresight-link'

it('сохраняет ссылку и запускает префетч при сигнале намерения', async () => {
    const screen = await render(<ForesightLink href="/">На главную</ForesightLink>)
    const link = screen.getByRole('link', { name: 'На главную' })
    await expect.element(link).toHaveAttribute('href', '/')
    expect(nextRouterMock.prefetch).not.toHaveBeenCalled()
    await expect
        .poll(
            () =>
                ForesightManager.instance.registeredElements.get(screen.getByRole('link').element())
                    ?.isIntersectingWithViewport,
        )
        .toBe(true)
    await userEvent.hover(screen.getByRole('link'))
    await userEvent.keyboard('{Tab}')
    screen
        .getByRole('link')
        .element()
        .dispatchEvent(new Event('touchstart', { bubbles: true }))
    await expect.poll(() => vi.mocked(nextRouterMock.prefetch).mock.calls.length).toBeGreaterThan(0)
    expect(nextRouterMock.prefetch).toHaveBeenCalledWith('/')
})

it('позволяет отключить предзагрузку', async () => {
    const screen = await render(
        <ForesightLink href="/" prefetch={false}>
            На главную
        </ForesightLink>,
    )
    await expect.element(screen.getByRole('link')).toHaveAttribute('href', '/')
    await expect
        .poll(
            () =>
                ForesightManager.instance.registeredElements.get(screen.getByRole('link').element())
                    ?.isIntersectingWithViewport,
        )
        .toBe(true)
    await userEvent.hover(screen.getByRole('link'))
    await userEvent.keyboard('{Tab}')
    screen
        .getByRole('link')
        .element()
        .dispatchEvent(new Event('touchstart', { bubbles: true }))
    expect(nextRouterMock.prefetch).not.toHaveBeenCalled()
})
