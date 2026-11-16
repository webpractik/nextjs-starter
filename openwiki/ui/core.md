---
type: guide
title: UI и типизированные формы
description: UI и типизированные формы в Next.js Starter, инструкции и проверяемые контракты.
tags: [nextjs, starter, guide]
sources:
  - id: openwiki-source-808b9ff10fba3d7819aa09ab
    resource: repo://.storybook/main.ts
  - id: openwiki-source-82ba1b7f06b79d12e5fb0204
    resource: repo://src/components/ui/form/form.tsx
generated: { by: "codex", at: "2026-11-16T14:31:09.226Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T14:31:09.226Z
---

# Публичный API `#/components/ui`

> Тип: справочник · Статус: актуально · Источник истины: public index files в
> [`src/components/ui/`](../../COMPONENTS.md)

Прежде чем добавлять компонент в `src/components/ui`, сверьтесь с
[архитектурой](../architecture/overview.md#как-выбрать-место-для-кода).

## Главное правило импорта

У каталога UI нет общего корневого экспорта. Используйте публичный путь:

```tsx
import { Button } from '#/components/ui/button'
import { useAppForm } from '#/components/ui/form'
import { toast } from '#/components/ui/toast'
```

Публичный API задаётся в `index.ts` или `index.tsx`. Импорты внутренних файлов вроде
`#/components/ui/button/button` и пути `~/src/components/ui/...` запрещены: они усложняют рефакторинг.

## Доступные subpaths

| Группа      | Subpaths                                                                     |
| ----------- | ---------------------------------------------------------------------------- |
| Inputs      | `checkbox`, `input`, `radio-group`, `select`, `slider`, `switch`, `textarea` |
| Composition | `attachment`, `card`, `dialog`, `field`, `tabs`                              |
| Feedback    | `badge`, `skeleton`, `toast`, `tooltip`                                      |
| Foundation  | `button`, `label`, `separator`, `typography`                                 |
| Content     | `sanitized-html`                                                             |
| Forms       | `form` и зарегистрированные field components                                 |

Таблица помогает найти компонент. Полный API проверяйте в публичном индексе и TypeScript,
состояния — в соседних историях Storybook.

## Типизированные формы

`#/components/ui/form` экспортирует `useAppForm`, помощники формы и контекста, `SubmitButton` и поля:

- `TextField`, `TextareaField`, `NumberField`, `DateField`, `PhoneField`;
- `CheckboxField`, `SwitchField`, `SelectField`, `RadioGroupField`, `SliderField`.

В нативном `<form>` отмените браузерную отправку и вызовите `void form.handleSubmit()`.
Рендерите поля через `form.AppField`, компоненты уровня формы — внутри `form.AppForm`.
Передавайте Zod-схему валидаторам TanStack напрямую через Standard Schema.

Рабочий пример — в [разделе «Формы»](../../README.md#формы), экспорты — в
[`src/components/ui/form/index.ts`](../../src/components/ui/form/index.ts).

## Недоверенный HTML

`SanitizedHtml` очищает HTML из API, CMS и других недоверенных источников перед вставкой через
React, одинаково в Node.js и браузере:

```tsx
import { SanitizedHtml } from '#/components/ui/sanitized-html'

export function Article({ html }: { html: string }) {
    return <SanitizedHtml className="prose" html={html} />
}
```

`html` обязателен; `children` и переданный потребителем `dangerouslySetInnerHTML` не поддерживаются.
Остальные props `div`, включая `className`, `aria-*`, `data-*` и `ref`, передаются корневому контейнеру.

Очистка снижает риск XSS, но не защищает от недостоверного текста, фишинга, обманных ссылок и
нежелательного допустимого контента. Ограничивайте размер HTML на границе API/CMS: синхронная
очистка больших строк может быть затратной и не заменяет лимит.

## Если нужно добавить или изменить примитив

1. Убедитесь, что компонент не содержит бизнес-типов и нужен минимум двум областям приложения.
2. Для интерактивного компонента используйте Base UI; не заменяйте его Radix без отдельного
   решения.
3. Сохраните семантику доступности и передачу props. Варианты оформите через CVA, классы
   объедините через `cn`.
4. Экспортируйте поддерживаемый контракт из локального индекса.
5. Добавьте историю Storybook для состояний и браузерный компонентный тест для поведения.
6. Проверьте клавиатуру, фокус, состояния disabled/invalid и доступное имя.
7. При несовместимом изменении обновите потребителей и этот справочник.

## Проверка

```bash
npm run test:component
npm run build-storybook
npm run tsc
npm run lint
```

UI используется из исходников приложения; отдельного npm-пакета нет.

## Связанные документы

- [Как устроен проект](../architecture/overview.md)
- [Как писать и запускать тесты](../testing/testing.md)
- [Карта компонентов](../../COMPONENTS.md)
