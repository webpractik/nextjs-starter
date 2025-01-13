'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
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

export const FormField = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    ...props
}: ControllerProps<TFieldValues, TName>) => {
    return (
        <FormFieldContext.Provider value={useMemo(() => ({ name: props.name }), [props.name])}>
            <Controller {...props} />
        </FormFieldContext.Provider>
    );
};

export const useFormField = () => {
    const fieldContext = useContext(FormFieldContext);
    const itemContext = useContext(FormItemContext);
    const { getFieldState, formState } = useFormContext();

    const fieldState = getFieldState(fieldContext.name, formState);

    if (!fieldContext) {
        throw new Error('useFormField should be used within <FormField>');
    }

    const { id } = itemContext;

    return {
        id,
        name: fieldContext.name,
        formItemId: `${id}-form-item`,
        formDescriptionId: `${id}-form-item-description`,
        formMessageId: `${id}-form-item-message`,
        ...fieldState,
    };
};

type FormItemProps = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> };

export const FormItem = ({ className, ref, ...props }: FormItemProps) => {
    const id = useId();

    return (
        <FormItemContext.Provider value={useMemo(() => ({ id }), [id])}>
            <div ref={ref} className={cn('space-y-2', className)} {...props} />
        </FormItemContext.Provider>
    );
};

FormItem.displayName = 'FormItem';

type FormLabelProps = ComponentProps<typeof LabelPrimitive.Root> & {
    ref?: Ref<typeof LabelPrimitive.Root>;
};

export const FormLabel = ({ className, ref, ...props }: FormLabelProps) => {
    const { error, formItemId } = useFormField();

    return (
        <Label
            ref={ref}
            className={cn(error && 'text-destructive', className)}
            htmlFor={formItemId}
            {...props}
        />
    );
};

FormLabel.displayName = 'FormLabel';

type FormControlProps = ComponentProps<typeof Slot> & { ref?: Ref<typeof Slot> };

export const FormControl = ({ ref, ...props }: FormControlProps) => {
    const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

    return (
        <Slot
            ref={ref}
            id={formItemId}
            aria-invalid={Boolean(error)}
            aria-describedby={
                error ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`
            }
            {...props}
        />
    );
};

FormControl.displayName = 'FormControl';

type FormDescriptionProps = HTMLAttributes<HTMLParagraphElement> & {
    ref?: Ref<HTMLParagraphElement>;
};

export const FormDescription = ({ ref, className, ...props }: FormDescriptionProps) => {
    const { formDescriptionId } = useFormField();

    return (
        <p
            ref={ref}
            id={formDescriptionId}
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
};

FormDescription.displayName = 'FormDescription';

type FormMessageProps = HTMLAttributes<HTMLParagraphElement> & { ref?: Ref<HTMLParagraphElement> };

export const FormMessage = ({ ref, className, children, ...props }: FormMessageProps) => {
    const { error, formMessageId } = useFormField();
    const body = error ? String(error?.message) : children;

    if (!body) {
        return null;
    }

    return (
        <p
            ref={ref}
            id={formMessageId}
            className={cn('text-sm font-medium text-destructive', className)}
            {...props}
        >
            {body}
        </p>
    );
};

FormMessage.displayName = 'FormMessage';

export { FormProvider as Form } from 'react-hook-form';
