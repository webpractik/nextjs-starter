# Next.js Starter

Стартовый монорепозиторий на Next.js для production: общие компоненты, типизированный API-клиент,
наблюдаемость и браузерные тесты.

## Быстрый старт

Требования: Node.js 24.15.0 или новее в ветке 24.x и npm 11.x.

```bash
npm ci
test -e .env || cp .env.example .env
npx lefthook install
npm run dev
```

Откройте <http://nextjs-starter.127.0.0.1.nip.io:3000>. nip.io направляет имя на
`127.0.0.1` без изменений в системном `hosts`.

Существующий `.env` не перезаписывается и не дополняется: сверьте его с `.env.example`.
Next.js проверяет переменные при загрузке конфига. Заменяя локальные заглушки, следуйте
[справочнику переменных окружения](docs/environment.md).

## Возможности

- Next.js 16 App Router, React 19, TypeScript 7 и Tailwind CSS 4.
- Cache Components включены; React Compiler работает только в production-сборках.
- npm workspaces для `@repo/core` и `@repo/api`.
- UI-примитивы в стиле Base UI/shadcn, безопасный вывод HTML и типизированная композиция
  TanStack Form в `@repo/core`.
- Контракт OpenAPI 3.2, проверка Redocly и генерация Hey API: типы TypeScript, клиент Next.js,
  плоский SDK, схемы Zod, опции TanStack Query, фабрики Faker и теги кеша.
  Публичные точки входа: `@repo/api`, `/client`, `/query`, `/schemas`, `/mocks` и
  `/cache-tags`.
- Серверные моки работают без бэкенда на внутренних сгенерированных маршрутах;
  [в браузере при разработке мешает BFF-префикс](docs/mock-mode.md#известное-ограничение-browser-development).
- Sentry, OpenTelemetry, логи Adze и метрики Prometheus.
- Модульные и браузерные компонентные тесты Vitest, Playwright E2E и Storybook.
- Oxfmt, Oxlint, Knip, JSCPD, Lefthook и Commitizen.

Контракт Petstore в `packages/api/openapi/` демонстрирует кодогенерацию, без бэкенда и обработчиков
Next.js. `@hey-api/openapi-ts@0.99.0` совместим через изолированный алиас TypeScript 6.0.3;
приложение проверяется TypeScript 7. Этапы генерации и условия удаления алиаса — в
[руководстве по генерации API-клиента](docs/api-codegen.md).

## Формы

`@repo/core/form` экспортирует общую типизированную фабрику форм `useAppForm`. Она регистрирует
поля text, textarea, number, date, phone, checkbox, switch, select, radio-group и slider вместе с
`SubmitButton`.

Передавайте событие отправки нативной `<form>` экземпляру TanStack Form. Схемы Zod 4 поддерживают
Standard Schema и передаются напрямую, без адаптера:

```tsx
'use client'

import { useAppForm } from '@repo/core/form'
import { z } from 'zod'

const projectSchema = z.object({ name: z.string().min(3) })

export function ProjectForm() {
    const form = useAppForm({
        defaultValues: { name: '' },
        validators: { onChange: projectSchema },
        onSubmit: ({ value }) => {
            // Отправьте типизированное значение на границу приложения.
        },
    })

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault()
                void form.handleSubmit()
            }}
        >
            <form.AppField name="name">
                {(field) => <field.TextField label="Название проекта" />}
            </form.AppField>
            <form.AppForm>
                <form.SubmitButton>Сохранить</form.SubmitButton>
            </form.AppForm>
        </form>
    )
}
```

TanStack Form Devtools подключаются только при разработке, не в production и тестах. Импорты и
работа с компонентами — в
[справочнике `@repo/core`](docs/core-ui.md).

## Проверка

```bash
npm run verify:fast # форматирование, lint и TypeScript
npm run test        # все Vitest projects
npm run test:e2e    # Playwright E2E с development server
npm run verify      # полный локальный набор проверок
```

`verify` запускает `verify:fast`, Knip, JSCPD, все проекты Vitest, затем Playwright E2E.
Перед коммитом Lefthook форматирует файлы в индексе Git и запускает `verify:fast`.

GitLab CI разделяет `verify:fast` и Vitest на этапы, не запускает standalone Playwright E2E и не
собирает Next.js для развёртывания. `.gitlab/deploy.yaml` закомментирован: публикации и
развёртывания нет. Будущей задаче нужна собственная сборка или готовый неизменяемый артефакт — см.
[правила тестирования](docs/testing-guidelines.md) и
[руководство по развёртыванию](docs/deployment.md).

## Служебные endpoints

- Health: `/api/health`
- Readiness: `/api/ready`
- Prometheus metrics: `/api/metrics`

Health и readiness сейчас всегда возвращают `200`; readiness не проверяет внешние зависимости.
Для локальной production-проверки выполните `npm run build`, затем `npm run prod`.

## Документация

Начните с [индекса документации](docs/README.md):

- [Архитектура](docs/architecture.md)
- [Переменные окружения](docs/environment.md)
- [Генерация API-клиента](docs/api-codegen.md)
- [BFF proxy](docs/bff-proxy.md)
- [Режим моков](docs/mock-mode.md)
- [Кеширование и потоковый рендеринг](docs/cache-and-streaming.md)
- [Компоненты `@repo/core`](docs/core-ui.md)
- [Правила тестирования](docs/testing-guidelines.md)
- [Конфигурация Oxlint](docs/oxlint-rules.md)
- [Развёртывание](docs/deployment.md)
