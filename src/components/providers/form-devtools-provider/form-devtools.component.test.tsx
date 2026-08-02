import { useAppForm } from '@repo/core/form'
import { expect, it } from 'vitest'
import { render } from 'vitest-browser-react'

import { FormDevtools } from './form-devtools'

function MountedFormDevtools() {
    const form = useAppForm({
        defaultValues: { name: '' },
    })

    return (
        <>
            <form.AppField name="name">{(field) => <field.TextField label="Name" />}</form.AppField>
            <FormDevtools />
        </>
    )
}

it('показывает плагин TanStack Form при открытии панели с подключённой формой', async () => {
    const screen = await render(<MountedFormDevtools />)

    await screen.getByRole('button', { name: 'Open TanStack Devtools' }).click()

    await expect.element(screen.getByText('TanStack Form')).toBeVisible()
})
