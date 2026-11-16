import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Desktop, Laptop, Mobile, Tablet } from '#/components/utilities/responsive'

function ResponsiveShowcase() {
    return (
        <div className="space-y-3 rounded-lg border p-6">
            <p>Измените ширину окна предпросмотра. Диапазоны включают все размеры от порога.</p>
            <Mobile>
                <p>Mobile: от 320 px</p>
            </Mobile>
            <Tablet>
                <p>Tablet: от 768 px</p>
            </Tablet>
            <Laptop>
                <p>Laptop: от 1024 px</p>
            </Laptop>
            <Desktop>
                <p>Desktop: от 1280 px</p>
            </Desktop>
        </div>
    )
}

const meta = {
    component: ResponsiveShowcase,
    title: 'utilities/Responsive',
} satisfies Meta<typeof ResponsiveShowcase>

export default meta

type Story = StoryObj<typeof meta>

export const Breakpoints: Story = {}
