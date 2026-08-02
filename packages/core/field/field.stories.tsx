import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { Checkbox } from '../checkbox'
import { Input } from '../input'
import { Switch } from '../switch'
import { Textarea } from '../textarea'
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSet,
    FieldTitle,
} from './field'

const meta: Meta<typeof Field> = {
    component: Field,
    title: 'core/Field',
    argTypes: {
        orientation: {
            control: 'select',
            options: ['vertical', 'horizontal', 'responsive'],
        },
    },
}

export default meta

type Story = StoryObj<typeof Field>

export const Default: Story = {
    render: () => (
        <Field>
            <FieldLabel htmlFor="name">Имя</FieldLabel>
            <Input id="name" placeholder="Введите имя" />
        </Field>
    ),
}

export const WithDescription: Story = {
    render: () => (
        <Field>
            <FieldLabel htmlFor="email">Электронная почта</FieldLabel>
            <Input id="email" type="email" placeholder="email@example.com" />
            <FieldDescription>Мы никому не передадим вашу электронную почту.</FieldDescription>
        </Field>
    ),
}

export const WithError: Story = {
    render: () => (
        <Field data-invalid="true">
            <FieldLabel htmlFor="password">Пароль</FieldLabel>
            <Input id="password" type="password" aria-invalid />
            <FieldError>Пароль должен содержать не менее 8 символов.</FieldError>
        </Field>
    ),
}

export const WithMultipleErrors: Story = {
    render: () => (
        <Field data-invalid="true">
            <FieldLabel htmlFor="password2">Пароль</FieldLabel>
            <Input id="password2" type="password" aria-invalid />
            <FieldError
                errors={[
                    { message: 'Не менее 8 символов' },
                    { message: 'Добавьте хотя бы одну цифру' },
                    { message: 'Добавьте хотя бы один специальный символ' },
                ]}
            />
        </Field>
    ),
}

export const HorizontalOrientation: Story = {
    render: () => (
        <Field orientation="horizontal">
            <FieldLabel htmlFor="username">Имя пользователя</FieldLabel>
            <Input id="username" placeholder="@username" />
        </Field>
    ),
}

export const WithCheckbox: Story = {
    render: () => (
        <Field orientation="horizontal">
            <Checkbox id="terms" />
            <FieldContent>
                <FieldTitle>Принять условия использования</FieldTitle>
                <FieldDescription>
                    Вы соглашаетесь с Условиями использования и Политикой конфиденциальности.
                </FieldDescription>
            </FieldContent>
        </Field>
    ),
}

export const WithSwitch: Story = {
    render: () => (
        <Field orientation="horizontal">
            <FieldContent>
                <FieldTitle>Маркетинговые рассылки</FieldTitle>
                <FieldDescription>
                    Получать письма о новых продуктах и возможностях.
                </FieldDescription>
            </FieldContent>
            <Switch />
        </Field>
    ),
}

export const Disabled: Story = {
    render: () => (
        <Field data-disabled="true">
            <FieldLabel htmlFor="disabled">Недоступное поле</FieldLabel>
            <Input id="disabled" placeholder="Редактирование недоступно" disabled />
        </Field>
    ),
}

export const FieldSetExample: Story = {
    render: () => (
        <FieldSet>
            <FieldLegend>Личная информация</FieldLegend>
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="first-name">Имя</FieldLabel>
                    <Input id="first-name" placeholder="Иван" />
                </Field>
                <Field>
                    <FieldLabel htmlFor="last-name">Фамилия</FieldLabel>
                    <Input id="last-name" placeholder="Иванов" />
                </Field>
                <Field>
                    <FieldLabel htmlFor="bio">О себе</FieldLabel>
                    <Textarea id="bio" placeholder="Расскажите о себе" />
                    <FieldDescription>Не более 500 символов.</FieldDescription>
                </Field>
            </FieldGroup>
        </FieldSet>
    ),
}

export const LegendVariants: Story = {
    render: () => (
        <div className="space-y-6">
            <FieldSet>
                <FieldLegend variant="legend">Вариант легенды (по умолчанию)</FieldLegend>
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="l1">Поле</FieldLabel>
                        <Input id="l1" />
                    </Field>
                </FieldGroup>
            </FieldSet>
            <FieldSet>
                <FieldLegend variant="label">Вариант подписи</FieldLegend>
                <FieldGroup>
                    <Field>
                        <FieldLabel htmlFor="l2">Поле</FieldLabel>
                        <Input id="l2" />
                    </Field>
                </FieldGroup>
            </FieldSet>
        </div>
    ),
}
