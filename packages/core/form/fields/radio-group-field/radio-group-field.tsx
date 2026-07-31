'use client'

import type { ComponentProps, ReactNode } from 'react'

import type { FieldShellProps } from '../shared'

import { cn } from '../../../cn'
import { Label } from '../../../label'
import { RadioGroup, RadioGroupItem } from '../../../radio-group'
import { useFieldContext } from '../../form-context'
import { FieldShell } from '../shared'

type RadioGroupControlProps = ComponentProps<typeof RadioGroup>

export interface RadioOption {
    description?: ReactNode
    disabled?: boolean
    label: ReactNode
    value: string
}

export type RadioGroupFieldProps = FieldShellProps &
    Omit<
        RadioGroupControlProps,
        'children' | 'className' | 'defaultValue' | 'id' | 'name' | 'onValueChange' | 'value'
    > & {
        groupClassName?: string
        optionClassName?: string
        options: readonly RadioOption[]
    }

export function RadioGroupField({
    className,
    description,
    disabled = false,
    groupClassName,
    label,
    optionClassName,
    options,
    ...groupProps
}: RadioGroupFieldProps) {
    const field = useFieldContext<unknown>()
    const value = typeof field.state.value === 'string' ? field.state.value : undefined

    return (
        <FieldShell
            className={className}
            description={description}
            disabled={disabled}
            field={field}
            label={label}
        >
            {(controlProps) => (
                <RadioGroup
                    {...groupProps}
                    {...controlProps}
                    className={cn('items-stretch gap-2', groupClassName)}
                    disabled={disabled}
                    name={field.name}
                    onValueChange={(nextValue) => {
                        field.handleChange(nextValue)
                        field.handleBlur()
                    }}
                    value={value}
                >
                    {options.map((option, index) => {
                        const optionId = `${controlProps.id}-option-${index}`
                        const descriptionId = option.description
                            ? `${optionId}-description`
                            : undefined

                        return (
                            <div className={cn(`
                                      flex items-start gap-3 rounded-md border border-input p-3
                                      has-data-checked:border-primary
                                      has-data-disabled:cursor-not-allowed
                                      has-data-disabled:opacity-50
                                    `, optionClassName)} key={option.value}>
                                <RadioGroupItem
                                    aria-describedby={descriptionId}
                                    disabled={option.disabled}
                                    id={optionId}
                                    value={option.value}
                                />
                                <div className="flex min-w-0 flex-col gap-1">
                                    <Label htmlFor={optionId}>{option.label}</Label>
                                    {option.description ? (
                                        <span
                                            className="text-sm text-muted-foreground"
                                            id={descriptionId}
                                        >
                                            {option.description}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        )
                    })}
                </RadioGroup>
            )}
        </FieldShell>
    )
}
