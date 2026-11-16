import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Switch } from '#/components/ui/switch'

it('меняет состояние по нажатию и поддерживает отключённый режим', async () => {
    const onCheckedChange = vi.fn()
    const screen = await render(
        <Switch aria-label="Уведомления" onCheckedChange={onCheckedChange} />,
    )
    const control = screen.getByRole('switch', { name: 'Уведомления' })
    await expect.element(control).not.toBeChecked()
    await control.click()
    await expect.element(control).toBeChecked()
    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true)
    await screen.rerender(<Switch aria-label="Уведомления" disabled />)
    await expect.element(control).toBeDisabled()
})
