import { useState } from 'react'
import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'
import { userEvent } from 'vitest/browser'

import {
    Slider,
    SliderControl,
    SliderIndicator,
    SliderLabel,
    SliderThumb,
    SliderTrack,
    SliderValue,
} from '.'

function ScalarSlider({ onCommit }: { onCommit: (_value: number | readonly number[]) => void }) {
    const [value, setValue] = useState(40)

    return (
        <Slider value={value} onValueChange={setValue} onValueCommitted={onCommit}>
            <SliderLabel>Build confidence</SliderLabel>
            <SliderValue />
            <SliderControl>
                <SliderTrack>
                    <SliderIndicator />
                    <SliderThumb />
                </SliderTrack>
            </SliderControl>
        </Slider>
    )
}

function RangeSlider() {
    const [value, setValue] = useState<readonly number[]>([20, 80])

    return (
        <Slider value={value} onValueChange={setValue}>
            <SliderValue>{(_formattedValues, values) => values.join(' - ')}</SliderValue>
            <SliderControl>
                <SliderTrack>
                    <SliderIndicator />
                    <SliderThumb aria-label="Minimum confidence" index={0} />
                    <SliderThumb aria-label="Maximum confidence" index={1} />
                </SliderTrack>
            </SliderControl>
        </Slider>
    )
}

it('updates a controlled scalar value and preserves the commit callback', async () => {
    const onCommit = vi.fn<(_value: number | readonly number[]) => void>()
    const screen = await render(<ScalarSlider onCommit={onCommit} />)
    const slider = screen.getByRole('slider', { name: 'Build confidence' })

    await expect.element(slider).toHaveValue('40')
    await expect.element(screen.getByText('40')).toBeVisible()

    slider.element().focus()
    await userEvent.keyboard('{ArrowRight}')

    await expect.element(slider).toHaveValue('41')
    await expect.element(screen.getByText('41')).toBeVisible()
    expect(onCommit).toHaveBeenCalledWith(41, expect.anything())
})

it('updates the selected thumb of a controlled range', async () => {
    const screen = await render(<RangeSlider />)
    const minimum = screen.getByRole('slider', { name: 'Minimum confidence' })
    const maximum = screen.getByRole('slider', { name: 'Maximum confidence' })

    await expect.element(minimum).toHaveValue('20')
    await expect.element(maximum).toHaveValue('80')
    await expect.element(screen.getByText('20 - 80')).toBeVisible()

    maximum.element().focus()
    await userEvent.keyboard('{ArrowRight}')

    await expect.element(maximum).toHaveValue('81')
    await expect.element(screen.getByText('20 - 81')).toBeVisible()
})

it('disables interaction for every slider thumb', async () => {
    const onValueChange = vi.fn()
    const screen = await render(
        <Slider disabled value={25} onValueChange={onValueChange}>
            <SliderControl>
                <SliderTrack>
                    <SliderIndicator />
                    <SliderThumb aria-label="Disabled confidence" />
                </SliderTrack>
            </SliderControl>
        </Slider>,
    )
    const slider = screen.getByRole('slider', { name: 'Disabled confidence' })

    await expect.element(slider).toBeDisabled()
    slider.element().focus()
    await userEvent.keyboard('{ArrowRight}')

    await expect.element(slider).toHaveValue('25')
    expect(document.activeElement).not.toBe(slider.element())
    expect(onValueChange).not.toHaveBeenCalled()
})
