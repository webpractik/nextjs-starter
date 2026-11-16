import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { FormDevtoolsProvider } from '#/components/providers/form-devtools-provider'
import { useAppForm } from '#/components/ui/form'

function DevelopmentProviderShowcase() {
    const form = useAppForm({ defaultValues: { name: 'Аполлон' } })

    return (
        <div className="w-full max-w-sm space-y-3">
            <p>
                Панель доступна только при запуске в development. В production провайдер ничего не
                отображает.
            </p>
            <form.AppField name="name">
                {(field) => <field.TextField label="Название проекта" />}
            </form.AppField>
            <FormDevtoolsProvider />
        </div>
    )
}

const meta = {
    component: FormDevtoolsProvider,
    title: 'providers/FormDevtoolsProvider',
    render: () => <DevelopmentProviderShowcase />,
} satisfies Meta<typeof FormDevtoolsProvider>

export default meta

type Story = StoryObj<typeof meta>

export const EnvironmentDependent: Story = {}
