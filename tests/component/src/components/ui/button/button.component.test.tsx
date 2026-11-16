import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { Button } from '#/components/ui/button'

it('активируется с клавиатуры и блокирует действие в disabled', async () => {
    const onClick = vi.fn()
    const screen = await render(<Button onClick={onClick}>Сохранить</Button>)
    const button = screen.getByRole('button', { name: 'Сохранить' })
    button.element().focus()
    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
    await screen.rerender(
        <Button disabled onClick={onClick}>
            Сохранить
        </Button>,
    )
    await expect.element(button).toBeDisabled()
    await userEvent.keyboard('{Enter}')
    expect(onClick).toHaveBeenCalledTimes(1)
})
