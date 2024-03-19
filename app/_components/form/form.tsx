import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import { Label } from 'core/label';
import {
    ComponentPropsWithoutRef,
    createContext,
    ElementRef,
    forwardRef,
    HTMLAttributes,
    useContext,
    useId,
    useMemo,
} from 'react';
import {
    Controller,
    ControllerProps,
    FieldPath,
    FieldValues,
    useFormContext,
} from 'react-hook-form';

import { cn } from '~/lib/utils/cn';

type FormFieldContextValue<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
    name: TName;
};

type FormItemContextValue = {
    id: string;
};

const FormFieldContext = createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

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

export const FormItem = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => {
        const id = useId();

        return (
            <FormItemContext.Provider value={useMemo(() => ({ id }), [id])}>
                <div ref={ref} className={cn('space-y-2', className)} {...props} />
            </FormItemContext.Provider>
        );
    }
);

FormItem.displayName = 'FormItem';

export const FormLabel = forwardRef<
    ElementRef<typeof LabelPrimitive.Root>,
    ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
    const { error, formItemId } = useFormField();

    return (
        <Label
            ref={ref}
            className={cn(error && 'text-destructive', className)}
            htmlFor={formItemId}
            {...props}
        />
    );
});

FormLabel.displayName = 'FormLabel';

export const FormControl = forwardRef<
    ElementRef<typeof Slot>,
    ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
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
});

FormControl.displayName = 'FormControl';

export const FormDescription = forwardRef<
    HTMLParagraphElement,
    HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
    const { formDescriptionId } = useFormField();

    return (
        <p
            ref={ref}
            id={formDescriptionId}
            className={cn('text-sm text-muted-foreground', className)}
            {...props}
        />
    );
});

FormDescription.displayName = 'FormDescription';

export const FormMessage = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
    ({ className, children, ...props }, ref) => {
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
    }
);

FormMessage.displayName = 'FormMessage';

export { FormProvider as Form } from 'react-hook-form';
