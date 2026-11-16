'use client'

import type { ComponentProps } from 'react'

import { Button } from '../../button'
import { useFormContext } from '../form-context'

export type SubmitButtonProps = Omit<ComponentProps<typeof Button>, 'type'> & {
    disableUntilValid?: boolean
}

export function SubmitButton({
    children = 'Submit',
    disabled,
    disableUntilValid = true,
    ...buttonProps
}: SubmitButtonProps) {
    const form = useFormContext()

    return (
        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
            {([canSubmit, isSubmitting]) => (
                <Button
                    {...buttonProps}
                    disabled={
                        Boolean(disabled) || isSubmitting || (disableUntilValid && !canSubmit)
                    }
                    type="submit"
                >
                    {children}
                </Button>
            )}
        </form.Subscribe>
    )
}
