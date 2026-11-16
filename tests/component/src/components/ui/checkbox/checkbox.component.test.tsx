import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { Checkbox } from '#/components/ui/checkbox'

it('переключает флажок с клавиатуры и передаёт новое значение', async () => {
    const onCheckedChange = vi.fn()
    const screen = await render(
        <Checkbox aria-label="Согласие" onCheckedChange={onCheckedChange} />,
    )
    const checkbox = screen.getByRole('checkbox', { name: 'Согласие' })
    await expect.element(checkbox).not.toBeChecked()
    checkbox.element().focus()
    await userEvent.keyboard(' ')
    await expect.element(checkbox).toBeChecked()
    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true)
    await screen.rerender(<Checkbox aria-label="Согласие" disabled />)
    await expect.element(checkbox).toBeDisabled()
})
