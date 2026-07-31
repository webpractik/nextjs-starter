'use client'

import type { ComponentProps } from 'react'

import type { FieldShellProps } from '../shared'

import { Checkbox } from '../../../checkbox'
import { useFieldContext } from '../../form-context'
import { ChoiceFieldShell, handleFieldBlur } from '../shared'

type CheckboxControlProps = ComponentProps<typeof Checkbox>

export type CheckboxFieldProps = FieldShellProps &
    Omit<
        CheckboxControlProps,
        'checked' | 'children' | 'className' | 'defaultChecked' | 'id' | 'name' | 'onCheckedChange'
    > & {
        controlClassName?: CheckboxControlProps['className']
    }

export function CheckboxField({
    className,
    controlClassName,
    description,
    disabled = false,
    label,
    onBlur,
    ...checkboxProps
}: CheckboxFieldProps) {
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
                <Checkbox
                    {...checkboxProps}
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
