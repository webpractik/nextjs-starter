import { composeStories } from '@storybook/react'
import * as allure from 'allure-js-commons'
import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import * as stories from './select.stories'

const { WithLabel } = composeStories(stories)

it('показывает placeholder до выбора и затем отображает выбранный вариант', async () => {
    await allure.labels(
        { name: 'layer', value: 'Component-front' },
        { name: 'feature', value: 'UI components' },
        { name: 'story', value: 'Совместимость компонентов с Vitest 5' },
        { name: 'severity', value: 'normal' },
    )
    const screen = await render(<WithLabel />)
    const select = screen.getByRole('combobox', { name: 'Вариант' })

    await expect.element(select).toHaveAttribute('data-placeholder', '')
    await expect.element(select).toMatchTextContent('Выберите вариант')

    await select.click()
    await screen.getByRole('option', { name: 'Второй вариант' }).click()

    await expect.element(select).not.toHaveAttribute('data-placeholder')
    await expect.element(select).toMatchTextContent('Второй вариант')
})
