import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

import { Textarea } from '#/components/ui/textarea'

it('сохраняет многострочный ввод, callback и readOnly', async () => {
    const onChange = vi.fn()
    const screen = await render(<Textarea aria-label="Описание" onChange={onChange} />)
    const textarea = screen.getByRole('textbox', { name: 'Описание' })
    await textarea.fill('Первая строка\nВторая строка')
    await expect.element(textarea).toHaveValue('Первая строка\nВторая строка')
    expect(onChange).toHaveBeenCalled()
    await screen.rerender(<Textarea aria-label="Описание" aria-invalid="true" readOnly />)
    await expect.element(textarea).toHaveAttribute('readonly')
    await expect.element(textarea).toHaveAttribute('aria-invalid', 'true')
})
