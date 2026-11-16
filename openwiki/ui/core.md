---
type: guide
title: UI и типизированные формы
description: UI и типизированные формы в Next.js Starter, инструкции и проверяемые контракты.
tags: [nextjs, starter, guide]
sources:
  - id: openwiki-source-808b9ff10fba3d7819aa09ab
    resource: repo://.storybook/main.ts
  - id: openwiki-source-dc148dcfd63a2eebc35c0f06
    resource: repo://.storybook/preview.tsx
  - id: openwiki-source-8037e2358a2c4f9b2c722a11
    resource: repo://AGENTS.md
  - id: openwiki-source-850cd942fe1e04537aa0d1df
    resource: repo://app/layout.tsx
  - id: openwiki-source-8f2fa3c7cdb9e50628621d36
    resource: repo://COMPONENTS.md
  - id: openwiki-source-ca9eabc24825e6ff0edc2967
    resource: repo://DESIGN.md
  - id: openwiki-source-3d6d5d4c036e5f9639633a58
    resource: repo://src/components/ui/attachment/attachment.tsx
  - id: openwiki-source-82ba1b7f06b79d12e5fb0204
    resource: repo://src/components/ui/form/form.tsx
  - id: openwiki-source-83ed151b3d968ecfbaeb783c
    resource: repo://src/components/utilities/error-boundary/error-boundary.tsx
  - id: openwiki-source-5f2672458e0c4489200e59f8
    resource: repo://src/components/utilities/responsive.tsx
  - id: openwiki-source-7a6a4f0982c83e0b31c445fc
    resource: repo://src/hooks/use-responsive.ts
  - id: openwiki-source-af56594a1a698e5b1e7a2049
    resource: repo://tools/check-structure.mjs
  - id: openwiki-source-fbadcd8591b65031efaaedce
    resource: repo://vitest.config.ts
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:41:39.256Z
---

# Публичный API `#/components/ui`

> Тип: справочник · Статус: актуально · Источник истины: публичные индексные файлы в
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
`#/components/ui/button/button` и пути `~/src/components/ui/...` запрещены. Они усложняют рефакторинг.

## Доступные subpaths

| Группа      | Subpaths                                                                     |
| ----------- | ---------------------------------------------------------------------------- |
| Inputs      | `checkbox`, `input`, `radio-group`, `select`, `slider`, `switch`, `textarea` |
| Composition | `attachment`, `card`, `dialog`, `field`, `tabs`                              |
| Feedback    | `badge`, `skeleton`, `toast`, `tooltip`                                      |
| Foundation  | `button`, `label`, `separator`, `typography`                                 |
| Content     | `sanitized-html`                                                             |
| Forms       | `form` и зарегистрированные компоненты полей                                 |

Полный API компонента проверяйте в публичном индексе и TypeScript. Состояния смотрите
в историях из зеркального `stories/src/components/`.

## Типизированные формы

`#/components/ui/form` экспортирует `useAppForm`, помощники формы и контекста, `SubmitButton` и поля:

- `TextField`, `TextareaField`, `NumberField`, `DateField`, `PhoneField`;
- `CheckboxField`, `SwitchField`, `SelectField`, `RadioGroupField`, `SliderField`.

В нативном `<form>` отмените браузерную отправку и вызовите `void form.handleSubmit()`.
Рендерите поля через `form.AppField`, а компоненты уровня формы внутри `form.AppForm`.
Передавайте Zod-схему валидаторам TanStack напрямую через Standard Schema.

Рабочий пример находится в [руководстве по формам](forms.md).
Экспорты перечислены в [`src/components/ui/form/index.ts`](../../src/components/ui/form/index.ts).

## Недоверенный HTML

`SanitizedHtml` очищает HTML из API, CMS и других недоверенных источников перед вставкой через
React, одинаково в Node.js и браузере:

```tsx
import { SanitizedHtml } from '#/components/ui/sanitized-html'

export function Article({ html }: { html: string }) {
    return <SanitizedHtml className="prose" html={html} />
}
```

`html` обязателен. `children` и переданный потребителем `dangerouslySetInnerHTML` не поддерживаются.
Остальные props `div`, включая `className`, `aria-*`, `data-*` и `ref`, передаются корневому контейнеру.

Очистка снижает риск XSS, но не защищает от недостоверного текста, фишинга, обманных ссылок и
нежелательного допустимого контента. Ограничивайте размер HTML на границе API или CMS. Синхронная
очистка больших строк может быть затратной и не заменяет лимит.

## Если нужно добавить или изменить примитив

1. Убедитесь, что компонент не содержит бизнес-типов и нужен минимум двум областям приложения.
2. Для интерактивного компонента используйте Base UI. Не заменяйте его Radix без отдельного
   решения.
3. Сохраните семантику доступности и передачу props. Варианты оформите через CVA, классы
   объедините через `cn`.
4. Экспортируйте поддерживаемый контракт из локального индекса.
5. Добавьте историю в `stories/` и браузерный тест в `tests/component/` с зеркальными путями исходника.
6. Проверьте управление с клавиатуры, фокус, состояния disabled и invalid, доступное имя.
7. При несовместимом изменении обновите потребителей и этот справочник.

## Проверка

```bash
npm run test:component
npm run build-storybook
npm run tsc
npm run lint
```

Размещение и наличие тестов и stories проверяет `npm run check:structure`.

UI используется из исходников приложения. Отдельного npm-пакета нет.

## Связанные документы

- [Как устроен проект](../architecture/overview.md)
- [Как писать и запускать тесты](../testing/testing.md)
- [Карта компонентов](../../COMPONENTS.md)

## COMPONENTS.md и DESIGN.md в рабочем процессе

Перед созданием, изменением и ревью UI прочитайте [COMPONENTS.md](../../COMPONENTS.md)
и [DESIGN.md](../../DESIGN.md). Карта помогает выбрать готовый компонент
и найти его публичный импорт. Дизайн описывает оформление нового экрана.

COMPONENTS.md описывает общие UI, поля, providers и utilities из src/components.
Обновляйте карту при добавлении, переносе или удалении общего компонента. Компоненты маршрута
остаются в app/.../_components/ и в карту не входят.

DESIGN.md фиксирует семантические цвета, Geist Sans, типографику, радиусы, варианты
компонентов и accessibility. Реализация находится в src/styles/globals.css, src/fonts
и src/components/ui. Документ не генерирует CSS. При изменении общих токенов или
визуальных вариантов обновляйте его по коду и проверяйте:

```bash
npx --yes --package=@google/design.md@0.4.0 designmd lint DESIGN.md
```

Текущая общая тема светлая. Тёмный Hero не задаёт тёмную тему приложения.
Порядок ребрендинга описан в [адаптации стартера](../development/adapting-starter.md).
[Руководство по формам](forms.md) описывает значения полей, отправку, ошибки и сброс.

## Providers и окружение Storybook

Storybook использует `@storybook/nextjs-vite`, addons a11y и docs. Истории и MDX
загружаются только из `stories/`. После этого префикса путь повторяет структуру исходника.

Root layout подключает NuqsAdapter для URL state, QueryProvider для TanStack Query,
Toaster для уведомлений и FormDevtoolsProvider. Devtools загружаются динамически
только при NODE_ENV=development, без SSR. В production и тестах панель отсутствует.

Storybook preview добавляет общий CSS и переменную шрифта, но не повторяет root layout.
Для истории с useQuery подключите QueryProvider через локальный decorator. URL state
требует соответствующего nuqs adapter, уведомления требуют Toaster. Не подключайте
все providers глобально для одной истории. Для истории с запросами настройте сгенерированные
моки либо явный транспорт. Не обращайтесь к production backend.

Компонентные тесты используют окружение из src/tests, а не Storybook decorators.
Сетевой запрос без явного мока завершается ошибкой. Используйте существующие алиасы Next.js
и фабрики Faker. Порядок запуска описан в [тестировании](../testing/testing.md).

## Responsive wrappers

`#/components/utilities/responsive` экспортирует Desktop, Laptop, Tablet и Mobile.
Они используют min-width условия, а не отдельные диапазоны:

| Wrapper | Условие | Значение до определения browser media query |
| --- | --- | --- |
| Mobile | от 320px | true |
| Tablet | от 768px | false |
| Laptop | от 1024px | false |
| Desktop | от 1280px | false |

На ширине 1440px все четыре условия истинны. Если разместить мобильную и desktop версии
рядом, отобразятся обе. Для адаптивного оформления предпочтительны
брейкпоинты CSS и Tailwind. Учитывайте смену содержимого после определения размера браузера.

## ErrorBoundary и повторная попытка

Ближайший route error.tsx обрабатывает ошибку рендера сегмента. Последняя граница
global-error.tsx возвращает собственные html/body. Для изолированного клиентского
поддерева используйте `#/components/utilities/error-boundary`.

Общий ErrorBoundary передаёт fallback, onError и onReset в SentryBoundary.
Параметр fallback получает resetError. Сброс повторяет рендер, но не исправляет API и не инвалидирует
Query cache. Для ошибки useQuery используйте query.isError и явный refetch, если выбран
обычный режим без проброса в boundary. Ошибки событийных обработчиков ловите в операции.

Стандартный ErrorFallback показывает error.message либо String(error). Для продукта
задайте безопасный fallback, если исключение может содержать внутренние данные.
Не передавайте сырые ответы backend и секреты в пользовательские сообщения.

## Attachment и загрузка файла

Attachment отображает вложение и состояния idle, uploading, processing, error, done.
Компонент не выполняет upload и не хранит файл на сервере. Потребитель организует выбор
файла, ограничения размера и типа, отправку, отмену, обработку ошибки и удаление. Состояние
и progress передавайте в UI по результату своей операции. Примеры композиции и действий
находятся в `stories/src/components/ui/attachment/`, независимость action от trigger
проверяется тестом из `tests/component/src/components/ui/attachment/`.
