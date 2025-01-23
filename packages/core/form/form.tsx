'use client';

import type * as LabelPrimitive from '@radix-ui/react-label';

import { Slot } from '@radix-ui/react-slot';
import { Label } from '@repo/core/label';
import {
    type ComponentProps,
    createContext,
    type HTMLAttributes,
    type Ref,
    useContext,
    useId,
    useMemo,
} from 'react';
import {
    Controller,
    type ControllerProps,
    type FieldPath,
    type FieldValues,
    useFormContext,
} from 'react-hook-form';

import { cn } from '../cn';

type FormFieldContextValue<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
    name: TName;
};

const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);

type FormItemContextValue = {
    id: string;
};

export const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

export function FormField<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
    return (
        <FormFieldContext value={useMemo(() => ({ name: props.name }), [props.name])}>
            <Controller {...props} />
        </FormFieldContext>
    );
}

export const useFormField = () => {
    const fieldContext = useContext(FormFieldContext);
    const itemContext = useContext(FormItemContext);
    const { formState, getFieldState } = useFormContext();

    const fieldState = getFieldState(fieldContext.name, formState);

    if (!fieldContext.name) {
        throw new Error('field should have name and should be used within <FormField>');
    }

    const { id } = itemContext;

    return {
        formDescriptionId: `${id}-form-item-description`,
        formItemId: `${id}-form-item`,
        formMessageId: `${id}-form-item-message`,
        id,
        name: fieldContext.name,
        ...fieldState,
    };
};

type FormItemProps = { ref?: Ref<HTMLDivElement> } & HTMLAttributes<HTMLDivElement>;

export function FormItem({ className, ref, ...props }: FormItemProps) {
    const id = useId();

    return (
        <FormItemContext value={useMemo(() => ({ id }), [id])}>
            <div className={cn('space-y-2', className)} ref={ref} {...props} />
        </FormItemContext>
    );
}

FormItem.displayName = 'FormItem';

type FormLabelProps = {
    ref?: Ref<typeof LabelPrimitive.Root>;
} & ComponentProps<typeof LabelPrimitive.Root>;

export function FormLabel({ className, ref, ...props }: FormLabelProps) {
    const { error, formItemId } = useFormField();

    return (
        <Label
            className={cn(error && 'text-destructive', className)}
            htmlFor={formItemId}
            ref={ref}
            {...props}
        />
    );
}

FormLabel.displayName = 'FormLabel';

type FormControlProps = { ref?: Ref<typeof Slot> } & ComponentProps<typeof Slot>;

export function FormControl({ ref, ...props }: FormControlProps) {
    const { error, formDescriptionId, formItemId, formMessageId } = useFormField();

    return (
        <Slot
            aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
            aria-invalid={Boolean(error)}
            id={formItemId}
            ref={ref}
            {...props}
        />
    );
}

FormControl.displayName = 'FormControl';

type FormDescriptionProps = {
    ref?: Ref<HTMLParagraphElement>;
} & HTMLAttributes<HTMLParagraphElement>;

export function FormDescription({ className, ref, ...props }: FormDescriptionProps) {
    const { formDescriptionId } = useFormField();

    return (
        <p
            className={cn('text-sm text-muted-foreground', className)}
            id={formDescriptionId}
            ref={ref}
            {...props}
        />
    );
}

FormDescription.displayName = 'FormDescription';

type FormMessageProps = { ref?: Ref<HTMLParagraphElement> } & HTMLAttributes<HTMLParagraphElement>;

export function FormMessage({ children, className, ref, ...props }: FormMessageProps) {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error.message) : children;

    if (!body) {
        return null;
    }

    return (
        <p
            className={cn('text-sm font-medium text-destructive', className)}
            id={formMessageId}
            ref={ref}
            {...props}
        >
            {body}
        </p>
    );
}

FormMessage.displayName = 'FormMessage';

export { FormProvider as Form } from 'react-hook-form';
