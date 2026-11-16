import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Input } from '#/components/ui/input'

it('принимает ввод, сообщает об изменении и сохраняет disabled и invalid', async () => {
    const onChange = vi.fn()
    const screen = await render(<Input aria-label="Имя" onChange={onChange} />)
    const input = screen.getByRole('textbox', { name: 'Имя' })
    await input.fill('Анна')
    await expect.element(input).toHaveValue('Анна')
    expect(onChange).toHaveBeenCalled()
    await screen.rerender(<Input aria-label="Имя" aria-invalid="true" disabled />)
    await expect.element(input).toBeDisabled()
    await expect.element(input).toHaveAttribute('aria-invalid', 'true')
})
