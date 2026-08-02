import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import { Tooltip, TooltipContent, TooltipTrigger } from '.'
import { Button } from '../button'

function TooltipDemo() {
    return (
        <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>Подсказка</TooltipTrigger>
            <TooltipContent>Дополнительные сведения</TooltipContent>
        </Tooltip>
    )
}

it('показывает подсказку при наведении и скрывает после ухода указателя', async () => {
    const screen = await render(<TooltipDemo />)
    const trigger = screen.getByRole('button', { name: 'Подсказка' })

    await userEvent.hover(trigger)
    await expect.element(screen.getByRole('tooltip')).toHaveTextContent('Дополнительные сведения')

    await userEvent.unhover(trigger)
    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()
})

it('показывает подсказку при фокусе и закрывает её клавишей Escape', async () => {
    const screen = await render(<TooltipDemo />)
    const trigger = screen.getByRole('button', { name: 'Подсказка' })

    trigger.element().focus()
    await expect.element(screen.getByRole('tooltip')).toBeVisible()

    await userEvent.keyboard('{Escape}')

    await expect.element(screen.getByRole('tooltip')).not.toBeInTheDocument()
    await expect.poll(() => document.activeElement).toBe(trigger.element())
})
