import { composeStories } from '@storybook/react'
import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import * as stories from './select.stories'

const { WithLabel } = composeStories(stories)

it('показывает placeholder до выбора и затем отображает выбранный вариант', async () => {
    const screen = await render(<WithLabel />)
    const select = screen.getByRole('combobox', { name: 'Вариант' })

    await expect.element(select).toHaveAttribute('data-placeholder', '')
    await expect.element(select).toHaveTextContent('Выберите вариант')

    await select.click()
    await screen.getByRole('option', { name: 'Второй вариант' }).click()

    await expect.element(select).not.toHaveAttribute('data-placeholder')
    await expect.element(select).toHaveTextContent('Второй вариант')
})
