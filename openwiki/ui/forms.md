---
type: "Справочник"
title: "Форма от ввода до ответа API"
description: Типизированная форма TanStack Form, контракты полей, отправка в SDK, ошибки и браузерные проверки.
tags: [forms, validation, api, testing]
openwiki_generated: true
sources:
  - id: openwiki-source-1f76089dfa89409f9655104e
    resource: repo://src/components/ui/form/fields/date-field/date-field.tsx
  - id: openwiki-source-74ae7b618f3930b4cf2ef266
    resource: repo://src/components/ui/form/fields/number-field/number-field.tsx
  - id: openwiki-source-78cb40229fe4e8f262ffdb2b
    resource: repo://src/components/ui/form/fields/phone-field/phone-field.tsx
  - id: openwiki-source-82ba1b7f06b79d12e5fb0204
    resource: repo://src/components/ui/form/form.tsx
  - id: openwiki-source-af01806e951845576366a18b
    resource: repo://src/components/ui/form/submit-button/submit-button.tsx
  - id: openwiki-source-0dd1141b15e6dd6453f96fa4
    resource: repo://stories/src/components/ui/form/form.stories.tsx
  - id: openwiki-source-3da932d18f0baefdb2aca57e
    resource: repo://tests/component/src/components/ui/form/form.component.test.tsx
  - id: openwiki-source-fbadcd8591b65031efaaedce
    resource: repo://vitest.config.ts
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:11:11.678Z
---


# Форма от ввода до ответа API

Используйте `useAppForm` из `#/components/ui/form`. Фабрика регистрирует общие поля
и SubmitButton. Перед началом найдите готовые поля в [COMPONENTS.md](../../COMPONENTS.md),
а оформление сверяйте с [DESIGN.md](../../DESIGN.md). Не копируйте сгенерированные схемы API.

## Минимальная форма с асинхронной отправкой

Пример использует текущий Petstore SDK и сгенерированную схему. Без backend включите
[моки](../development/mock-mode.md). Моки не сохраняют созданное животное между запросами.

```tsx
'use client'

import { useState } from 'react'

import { createPet } from '#/api'
import { zCreatePet } from '#/api/schemas'
import { useAppForm } from '#/components/ui/form'

export function CreatePetForm() {
    const [message, setMessage] = useState('')
    const form = useAppForm({
        defaultValues: { name: '' },
        validators: { onChange: zCreatePet },
        onSubmit: async ({ value, formApi }) => {
            setMessage('')
            try {
                await createPet({ body: value, throwOnError: true })
                formApi.reset()
                setMessage('Сохранено')
            } catch {
                setMessage('Не удалось сохранить. Проверьте данные и повторите попытку.')
            }
        },
    })

    return (
        <form onSubmit={(event) => {
            event.preventDefault()
            void form.handleSubmit()
        }}>
            <form.AppField name="name">
                {(field) => <field.TextField label="Имя" />}
            </form.AppField>
            <form.AppForm>
                <form.SubmitButton>Сохранить</form.SubmitButton>
            </form.AppForm>
            <p role="status">{message}</p>
        </form>
    )
}
```

Нативная form сохраняет отправку с клавиатуры. AppField предоставляет контекст конкретного
поля, AppForm предоставляет контекст SubmitButton. Zod передаётся напрямую через Standard
Schema. Кнопка учитывает canSubmit и isSubmitting. disableUntilValid=false отключает только
ограничение canSubmit, но не защиту во время отправки.

`throwOnError: true` превращает ошибку HTTP или Zod от SDK в исключение. Без этой опции проверьте
result.error до показа успеха или сброса. При ошибке пример сохраняет введённые значения.
При успехе reset возвращает исходные defaultValues. Для редактирования существующей записи
задайте подходящие исходные значения и обновите их осознанно после сохранения.

Если форма изменяет данные экрана, после успешной отправки обновите Query cache,
server tags или и то и другое по [руководству по кешированию](../architecture/cache-and-streaming.md).
Сам createPet не обновляет список и не инвалидирует кеши.

## Контракты значений полей

| Поле | Значение в форме | Что учитывать |
| --- | --- | --- |
| TextField, TextareaField | Строка | Обязательность и длину задаёт schema |
| NumberField | По умолчанию Number(value), при очистке undefined | Согласуйте defaultValues и optional schema. parse/format/emptyValue можно переопределить |
| DateField | Форматированная строка | По умолчанию ДД.ММ.ГГГГ. dateOptions меняет маску |
| PhoneField | Форматированная строка | По умолчанию RU, INTERNATIONAL, strict. phoneOptions меняет поведение |
| CheckboxField, SwitchField | Boolean | Обязательное согласие валидируйте отдельно от типа boolean |
| SelectField, RadioGroupField | Значение option | Согласуйте доступные options и schema |
| SliderField | Число либо массив чисел | Согласуйте одиночное значение или диапазон со schema |

Маска даты не превращает строку в Date, а маска телефона не заменяет бизнес-валидацию.
Если API ждёт ISO дату или нормализованный телефон, явно преобразуйте значение на границе
отправки и проверяйте результат. Пустое NumberField не равно нулю. Примеры всех полей
есть в `stories/src/components/ui/form/form.stories.tsx` и историях внутри
`stories/src/components/ui/form/fields/`.

## Ошибки API и доступность

FieldShell связывает label, description и ошибки с контролом через id и ARIA.
Передавайте осмысленный label, сохраняйте disabled/invalid и не заменяйте эту композицию
самодельной разметкой без проверки доступности.

Сгенерированный SDK возвращает типизированную ошибку из контракта. Ошибки backend
не связываются с полями формы автоматически. Сопоставляйте известные имена полей явно. Общую ошибку
показывайте рядом с формой. Не выводите необработанное тело ошибки, stack trace или токены.
FieldShell отображает сообщения из field.state.meta.errors. Форматирование поддерживает
строки, массивы и объекты с message, но не интерпретирует произвольный ответ backend.

Для server mutation повторите валидацию и проверку прав на сервере. Клиентская схема и
блокировка кнопки не защищают API. Секреты не передавайте в props формы.

## Как проверить изменение

Для формы добавьте историю в `stories/` и тест в `tests/component/`, повторяя путь
исходника после префикса. Для ответов используйте сгенерированные фабрики Faker
и существующий mock client.
Не создавайте второй набор API fixtures.

```bash
npx vitest run tests/component/src/components/ui/form/form.component.test.tsx --project component
npx vitest run tests/component/src/components/ui/form/fields/masked-fields.component.test.tsx --project component
npx vitest run tests/component/src/components/ui/form/submit-button/submit-button.component.test.tsx --project component
npm run check:structure
npm run tsc
npm run lint
```

В тесте своей формы проверьте ввод и отправку с клавиатуры, ошибку валидации, блокировку
повторной отправки, успешный ответ, сохранение ввода при ошибке API и сброс после успеха.
Маски проверяйте также вставкой и внешним изменением значения. Browser component runner
работает в Chromium. Правила fixtures и aliases находятся в [тестировании](../testing/testing.md).
