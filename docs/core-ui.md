# Публичный API `@repo/core`

> Тип: справочник · Статус: актуально · Источник истины: public index files в
> [`packages/core/`](../packages/core/)

Прежде чем добавлять компонент в `core`, сверьтесь с
[архитектурой](architecture.md#как-выбрать-место-для-кода).

## Главное правило импорта

У пакета нет общего корневого экспорта. Используйте публичный путь:

```tsx
import { Button } from '@repo/core/button'
import { useAppForm } from '@repo/core/form'
import { toast } from '@repo/core/toast'
```

Публичный API задаётся в `index.ts` или `index.tsx`. Импорты внутренних файлов вроде
`@repo/core/button/button` и пути `~/packages/core/...` запрещены: они усложняют рефакторинг.

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

`@repo/core/form` экспортирует `useAppForm`, помощники формы и контекста, `SubmitButton` и поля:

- `TextField`, `TextareaField`, `NumberField`, `DateField`, `PhoneField`;
- `CheckboxField`, `SwitchField`, `SelectField`, `RadioGroupField`, `SliderField`.

В нативном `<form>` отмените браузерную отправку и вызовите `void form.handleSubmit()`.
Рендерите поля через `form.AppField`, компоненты уровня формы — внутри `form.AppForm`.
Передавайте Zod-схему валидаторам TanStack напрямую через Standard Schema.

Рабочий пример — в [разделе «Формы»](../README.md#формы), экспорты — в
[`packages/core/form/index.ts`](../packages/core/form/index.ts).

## Недоверенный HTML

`SanitizedHtml` очищает HTML из API, CMS и других недоверенных источников перед вставкой через
React, одинаково в Node.js и браузере:

```tsx
import { SanitizedHtml } from '@repo/core/sanitized-html'

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

`@repo/core` используется из исходников внутри монорепозитория. Публикация в реестр и совместимость
по семантическим версиям для внешних потребителей пока не настроены.

## Связанные документы

- [Как устроен проект](architecture.md)
- [Как писать и запускать тесты](testing-guidelines.md)
- [Границы безопасности](security.md)
