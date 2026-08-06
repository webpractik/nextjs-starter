# Публичный API `@repo/core`

> Тип: справочник · Статус: актуально · Источник истины: public index files в
> [`packages/core/`](../packages/core/)

**Когда читать:** когда нужен готовый UI-примитив, поле формы или правильный import path. Для
решения, должен ли новый компонент попасть в `core`, сначала откройте
[архитектуру](architecture.md#как-выбрать-место-для-кода).

## Главное правило импорта

У пакета нет общего root barrel. Импортируйте из публичного subpath:

```tsx
import { Button } from '@repo/core/button'
import { useAppForm } from '@repo/core/form'
import { toast } from '@repo/core/toast'
```

Публичный API subpath задаёт его `index.ts` или `index.tsx`. Не импортируйте внутренние файлы вроде
`@repo/core/button/button` и не используйте `~/packages/core/...`: такие пути усложняют рефакторинг.

## Доступные subpaths

| Группа      | Subpaths                                                                     |
| ----------- | ---------------------------------------------------------------------------- |
| Inputs      | `checkbox`, `input`, `radio-group`, `select`, `slider`, `switch`, `textarea` |
| Composition | `attachment`, `card`, `dialog`, `field`, `tabs`                              |
| Feedback    | `badge`, `skeleton`, `toast`, `tooltip`                                      |
| Foundation  | `button`, `label`, `separator`, `typography`                                 |
| Content     | `sanitized-html`                                                             |
| Forms       | `form` и зарегистрированные field components                                 |

Имена props и exports проверяйте в public index и TypeScript, визуальные состояния — в соседних
Storybook stories. Эта таблица помогает найти компонент, но не фиксирует весь его API.

## Типизированные формы

`@repo/core/form` экспортирует `useAppForm`, form/context helpers, `SubmitButton` и поля:

- `TextField`, `TextareaField`, `NumberField`, `DateField`, `PhoneField`;
- `CheckboxField`, `SwitchField`, `SelectField`, `RadioGroupField`, `SliderField`.

Используйте нативный `<form>`, отмените browser submit и вызовите `void form.handleSubmit()`.
Поля рендерятся через `form.AppField`, form-level components — внутри `form.AppForm`. Zod-схема
передаётся TanStack validators напрямую через Standard Schema.

Полный рабочий пример есть в разделе [«Формы» корневого README](../README.md#формы), а контракт
экспортов — в [`packages/core/form/index.ts`](../packages/core/form/index.ts).

## Недоверенный HTML

Для HTML-строк из API, CMS или другого недоверенного источника используйте
`SanitizedHtml`. Компонент санитизирует строку одинаково в Node.js и браузере до
передачи её в React HTML insertion API:

```tsx
import { SanitizedHtml } from '@repo/core/sanitized-html'

export function Article({ html }: { html: string }) {
    return <SanitizedHtml className="prose" html={html} />
}
```

`html` обязателен; `children` и consumer-provided `dangerouslySetInnerHTML` не входят в public
props. Остальные `div` props, включая `className`, `aria-*`, `data-*` и `ref`, прокидываются
в корневой контейнер.

Санитизация снижает XSS-риск, но не подтверждает достоверность текста и не защищает
от phishing, обманных ссылок или нежелательного, но технически допустимого контента.
Размер HTML ограничивайте на API/CMS-границе: синхронная санитизация не заменяет input size
limit и может стать дорогой для чрезмерно большой строки.

## Если нужно добавить или изменить примитив

1. Убедитесь, что компонент не содержит бизнес-типов и нужен минимум двум областям приложения.
2. Для интерактивного компонента используйте Base UI; не заменяйте его Radix без отдельного
   решения.
3. Сохраните accessibility semantics и forwarded props. Варианты оформите через CVA, классы
   объедините через `cn`.
4. Экспортируйте поддерживаемый контракт из локального index.
5. Добавьте Storybook story для состояний и browser component test для поведения.
6. Проверьте клавиатуру, focus, состояния disabled/invalid и accessible name.
7. При breaking change обновите consumers и этот справочник.

## Проверка

```bash
npm run test:component
npm run build-storybook
npm run tsc
npm run lint
```

`@repo/core` используется как source workspace внутри монорепозитория. Публикация в registry и
semantic-version compatibility для внешних consumers сейчас не настроены.

## Связанные документы

- [Как устроен проект](architecture.md)
- [Как писать и запускать тесты](testing-guidelines.md)
- [Границы безопасности](security.md)
