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

const meta: Meta<typeof Slider> = {
    component: Slider,
    title: 'core/Slider',
}

export default meta

type Story = StoryObj<typeof Slider>

export const Default: Story = {
    render: () => (
        <Slider defaultValue={40}>
            <div className="flex items-center justify-between">
                <SliderLabel>Build confidence</SliderLabel>
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
                <SliderLabel>Confidence range</SliderLabel>
                <SliderValue>{(_formattedValues, values) => values.join(' – ')}</SliderValue>
            </div>
            <SliderControl>
                <SliderTrack>
                    <SliderIndicator />
                    <SliderThumb aria-label="Minimum confidence" index={0} />
                    <SliderThumb aria-label="Maximum confidence" index={1} />
                </SliderTrack>
            </SliderControl>
        </Slider>
    ),
}

export const Disabled: Story = {
    render: () => (
        <Slider disabled defaultValue={65}>
            <SliderLabel>Locked confidence</SliderLabel>
            <SliderControl>
                <SliderTrack>
                    <SliderIndicator />
                    <SliderThumb />
                </SliderTrack>
            </SliderControl>
        </Slider>
    ),
}
