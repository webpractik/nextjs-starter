import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group'

it('стрелкой выбирает следующий доступный вариант и сохраняет единственный выбор', async () => {
    const onValueChange = vi.fn()
    const screen = await render(
        <RadioGroup aria-label="Тариф" defaultValue="basic" onValueChange={onValueChange}>
            <RadioGroupItem value="basic" aria-label="Базовый" />
            <RadioGroupItem value="blocked" aria-label="Архивный" disabled />
            <RadioGroupItem value="pro" aria-label="Профессиональный" />
        </RadioGroup>,
    )
    const basic = screen.getByRole('radio', { name: 'Базовый' })
    basic.element().focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect.element(screen.getByRole('radio', { name: 'Профессиональный' })).toBeChecked()
    await expect.element(basic).not.toBeChecked()
    await expect.element(screen.getByRole('radio', { name: 'Архивный' })).toBeDisabled()
    expect(onValueChange.mock.calls[0]?.[0]).toBe('pro')
})
