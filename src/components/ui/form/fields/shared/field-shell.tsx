'use client'

import type { AnyFieldApi } from '@tanstack/react-form'
import type { ComponentProps, ReactNode } from 'react'

import { useId } from 'react'

import { cn } from '../../../cn'
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from '../../../field'
import { fieldErrorMessages } from './field-errors'

export interface FieldShellProps {
    className?: ComponentProps<typeof Field>['className']
    description?: ReactNode
    disabled?: boolean
    label: ReactNode
}

export interface FieldControlProps {
    'aria-describedby': string | undefined
    'aria-invalid': boolean
    'aria-labelledby': string
    id: string
}

interface FieldShellAdapterProps extends FieldShellProps {
    field: AnyFieldApi
    children: (_controlProps: FieldControlProps) => ReactNode
}

interface FieldIds {
    controlId: string
    descriptionId: string | undefined
    errorId: string | undefined
    labelId: string
}

function useFieldIds(field: AnyFieldApi, hasDescription: boolean, hasErrors: boolean): FieldIds {
    const reactId = useId().replaceAll(':', '')
    const controlId = `${String(field.name)}-${reactId}`

    return {
        controlId,
        descriptionId: hasDescription ? `${controlId}-description` : undefined,
        errorId: hasErrors ? `${controlId}-error` : undefined,
        labelId: `${controlId}-label`,
    }
}

function fieldMetadata(field: AnyFieldApi, hasErrors: boolean, disabled: boolean) {
    return {
        'data-disabled': disabled,
        'data-dirty': field.state.meta.isDirty,
        'data-invalid': hasErrors,
        'data-touched': field.state.meta.isTouched,
    }
}

function controlProps(ids: FieldIds, hasErrors: boolean): FieldControlProps {
    return {
        'aria-describedby': [ids.descriptionId, ids.errorId].filter(Boolean).join(' ') || undefined,
        'aria-invalid': hasErrors,
        'aria-labelledby': ids.labelId,
        id: ids.controlId,
    }
}

function FieldFeedback({
    description,
    descriptionId,
    errorId,
    messages,
}: {
    description: ReactNode
    descriptionId: string | undefined
    errorId: string | undefined
    messages: string[]
}) {
    const hasDescription = Boolean(description)

    return (
        <>
            {hasDescription ? (
                <FieldDescription id={descriptionId}>{description}</FieldDescription>
            ) : null}
            {messages.length > 0 ? (
                <FieldError id={errorId} errors={messages.map((message) => ({ message }))} />
            ) : null}
        </>
    )
}

export function FieldShell({
    children,
    className,
    description,
    disabled = false,
    field,
    label,
}: FieldShellAdapterProps) {
    const messages = fieldErrorMessages(field)
    const hasErrors = messages.length > 0
    const ids = useFieldIds(field, Boolean(description), hasErrors)

    return (
        <Field className={className} {...fieldMetadata(field, hasErrors, disabled)}>
            <FieldLabel id={ids.labelId} htmlFor={ids.controlId}>
                {label}
            </FieldLabel>
            {children(controlProps(ids, hasErrors))}
            <FieldFeedback
                description={description}
                descriptionId={ids.descriptionId}
                errorId={ids.errorId}
                messages={messages}
            />
        </Field>
    )
}

export function ChoiceFieldShell({
    children,
    className,
    description,
    disabled = false,
    field,
    label,
}: FieldShellAdapterProps) {
    const messages = fieldErrorMessages(field)
    const hasErrors = messages.length > 0
    const ids = useFieldIds(field, Boolean(description), hasErrors)

    return (
        <Field className={cn('gap-2', className)} {...fieldMetadata(field, hasErrors, disabled)}>
            <div className="flex items-start gap-3">
                {children(controlProps(ids, hasErrors))}
                <FieldContent>
                    <FieldLabel id={ids.labelId} htmlFor={ids.controlId}>
                        {label}
                    </FieldLabel>
                    <FieldFeedback
                        description={description}
                        descriptionId={ids.descriptionId}
                        errorId={ids.errorId}
                        messages={messages}
                    />
                </FieldContent>
            </div>
        </Field>
    )
}
