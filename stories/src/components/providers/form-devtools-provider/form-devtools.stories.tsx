import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { useAppForm } from '#/components/ui/form'

import { FormDevtools } from '../../../../../src/components/providers/form-devtools-provider/form-devtools'

function DevtoolsShowcase() {
    const form = useAppForm({ defaultValues: { name: '' } })

    return (
        <div className="w-full max-w-sm space-y-3">
            <p>Откройте панель TanStack Devtools и измените значение поля.</p>
            <form.AppField name="name">
                {(field) => <field.TextField label="Название проекта" />}
            </form.AppField>
            <FormDevtools />
        </div>
    )
}

const meta = {
    component: FormDevtools,
    title: 'providers/FormDevtools',
    render: () => <DevtoolsShowcase />,
} satisfies Meta<typeof FormDevtools>

export default meta

type Story = StoryObj<typeof meta>

export const ConnectedForm: Story = {}
