import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { TextField } from '#/components/ui/form'

import { FieldStory } from '../../../../../../../src/components/ui/form/fields/shared/field-story'

interface FieldStoryShowcaseProps {
    defaultValue: string
    validate?: (_value: unknown) => string | undefined
}

function FieldStoryShowcase(props: FieldStoryShowcaseProps) {
    return (
        <FieldStory {...props}>
            <TextField label="Значение" />
        </FieldStory>
    )
}

const meta = {
    component: FieldStoryShowcase,
    title: 'core/Form/Internal/FieldStory',
} satisfies Meta<typeof FieldStoryShowcase>

export default meta

type Story = StoryObj<typeof meta>

export const LiveValue: Story = { args: { defaultValue: 'Начальное значение' } }
export const Validation: Story = {
    args: {
        defaultValue: '',
        validate: (value) =>
            typeof value === 'string' && value.length >= 3
                ? undefined
                : 'Введите не менее трёх символов',
    },
}
