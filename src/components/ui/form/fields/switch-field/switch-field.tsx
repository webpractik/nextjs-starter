'use client'

import type { ComponentProps } from 'react'

import type { FieldShellProps } from '../shared'

import { Switch } from '../../../switch'
import { useFieldContext } from '../../form-context'
import { ChoiceFieldShell, handleFieldBlur } from '../shared'

type SwitchControlProps = ComponentProps<typeof Switch>

export type SwitchFieldProps = FieldShellProps &
    Omit<
        SwitchControlProps,
        'checked' | 'children' | 'className' | 'defaultChecked' | 'id' | 'name' | 'onCheckedChange'
    > & {
        controlClassName?: SwitchControlProps['className']
    }

export function SwitchField({
    className,
    controlClassName,
    description,
    disabled = false,
    label,
    onBlur,
    ...switchProps
}: SwitchFieldProps) {
    const field = useFieldContext<unknown>()

    return (
        <ChoiceFieldShell
            className={className}
            description={description}
            disabled={disabled}
            field={field}
            label={label}
        >
            {(controlProps) => (
                <Switch
                    {...switchProps}
                    {...controlProps}
                    checked={Boolean(field.state.value)}
                    className={controlClassName}
                    disabled={disabled}
                    name={field.name}
                    onBlur={(event) => handleFieldBlur(field, onBlur, event)}
                    onCheckedChange={(checked) => field.handleChange(checked)}
                />
            )}
        </ChoiceFieldShell>
    )
}
