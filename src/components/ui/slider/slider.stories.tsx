import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
    Slider,
    SliderControl,
    SliderIndicator,
    SliderLabel,
    SliderThumb,
    SliderTrack,
    SliderValue,
} from '.'

const meta = {
    component: Slider,
    title: 'core/Slider',
} satisfies Meta<typeof Slider>

export default meta

type Story = StoryObj<typeof Slider>

export const Default: Story = {
    render: () => (
        <Slider defaultValue={40}>
            <div className="flex items-center justify-between">
                <SliderLabel>Уверенность в сборке</SliderLabel>
                <SliderValue />
            </div>
            <SliderControl>
                <SliderTrack>
                    <SliderIndicator />
                    <SliderThumb />
                </SliderTrack>
            </SliderControl>
        </Slider>
    ),
}

export const Range: Story = {
    render: () => (
        <Slider defaultValue={[20, 80]}>
            <div className="flex items-center justify-between">
                <SliderLabel>Диапазон уверенности</SliderLabel>
                <SliderValue>{(_formattedValues, values) => values.join(' – ')}</SliderValue>
            </div>
            <SliderControl>
                <SliderTrack>
                    <SliderIndicator />
                    <SliderThumb aria-label="Минимальная уверенность" index={0} />
                    <SliderThumb aria-label="Максимальная уверенность" index={1} />
                </SliderTrack>
            </SliderControl>
        </Slider>
    ),
}

export const Disabled: Story = {
    render: () => (
        <Slider defaultValue={65} disabled>
            <SliderLabel>Зафиксированная уверенность</SliderLabel>
            <SliderControl>
                <SliderTrack>
                    <SliderIndicator />
                    <SliderThumb />
                </SliderTrack>
            </SliderControl>
        </Slider>
    ),
}
