'use client'

import { createFormHook } from '@tanstack/react-form'

import {
    CheckboxField,
    DateField,
    NumberField,
    PhoneField,
    RadioGroupField,
    SelectField,
    SliderField,
    SwitchField,
    TextareaField,
    TextField,
} from './fields'
import { fieldContext, formContext } from './form-context'
import { SubmitButton } from './submit-button'

const fieldComponents = {
    CheckboxField,
    DateField,
    NumberField,
    PhoneField,
    RadioGroupField,
    SelectField,
    SliderField,
    SwitchField,
    TextareaField,
    TextField,
}

const formComponents = {
    SubmitButton,
}

const appForm = createFormHook({
    fieldComponents,
    fieldContext,
    formComponents,
    formContext,
})

export const { extendForm, useAppForm, useTypedAppFormContext, withFieldGroup, withForm } = appForm
