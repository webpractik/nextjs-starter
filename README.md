# Next.js Starter

Production-ориентированный стартовый монорепозиторий на Next.js с общей библиотекой компонентов,
типизированным API-клиентом, наблюдаемостью и browser-тестами.

## Быстрый старт

Требования: Node.js 24 и поставляемая вместе с ним версия npm.

```bash
npm ci
test -e .env || cp .env.example .env
npx lefthook install
npm run dev
```

Откройте <http://nextjs-starter.127.0.0.1.nip.io:3000>. Имя разрешается через nip.io в
`127.0.0.1`, поэтому изменять системный `hosts` не нужно.

Команда не перезаписывает существующий `.env`. Приложение проверяет переменные окружения во время
загрузки Next.js config. Если файл был создан раньше, сравните его с актуальным `.env.example`:
новые обязательные переменные автоматически в него не попадут. Перед заменой локальных
placeholder-значений прочитайте
[справочник переменных окружения](docs/environment.md).

## Возможности

- Next.js 16 App Router, React 19, TypeScript 7 и Tailwind CSS 4.
- Включённые Cache Components; React Compiler работает только в production-сборках.
- npm workspaces для `@repo/core` и `@repo/api`.
- UI-примитивы в стиле Base UI/shadcn, безопасный HTML rendering и типизированная композиция
  TanStack Form в `@repo/core`.
- Исходный OpenAPI 3.2 contract, Redocly validation и сгенерированные Hey API TypeScript types,
  Next.js client, flat SDK, Zod schemas, TanStack Query options, Faker factories и cache tags.
  Facets экспортируются через `@repo/api`, `/client`, `/query`, `/schemas`, `/mocks` и
  `/cache-tags`.
- Server runtime mock mode на внутренних generated routes для работы без доступного backend;
  [browser development пока ограничен BFF-prefix](docs/mock-mode.md#известное-ограничение-browser-development).
- Sentry, OpenTelemetry, Adze logging и Prometheus metrics.
- Vitest unit- и browser component projects, Playwright E2E и Storybook.
- Oxfmt, Oxlint, Knip, JSCPD, Lefthook и Commitizen.

Petstore contract в `packages/api/openapi/` служит примером code generation. Он не добавляет
Petstore backend или Next.js Route Handlers. Генератор закреплён на
`@hey-api/openapi-ts@0.99.0`; его процесс использует изолированный TypeScript 6.0.3 compatibility
alias, тогда как проверки приложения остаются на TypeScript 7. Pipeline и условие удаления этого
shim описаны в [руководстве по генерации API-клиента](docs/api-codegen.md).

## Формы

Переиспользуемые формы экспортируются из `@repo/core/form` через единую типизированную фабрику
`useAppForm`. Она регистрирует поля text, textarea, number, date, phone, checkbox, switch, select,
radio-group и slider вместе с `SubmitButton`.

Используйте нативный элемент `<form>` и передавайте его submit event экземпляру TanStack Form.
Zod 4 schemas реализуют Standard Schema и могут передаваться напрямую, без resolver:

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

TanStack Form Devtools монтируются только в development и не попадают в production и test
application paths. Поддерживаемые public subpaths и component workflow описаны в
[справочнике `@repo/core`](docs/core-ui.md).

## Проверка

```bash
npm run verify:fast # форматирование, lint и TypeScript
npm run test        # все Vitest projects
npm run test:e2e    # Playwright E2E с development server
npm run verify      # полный локальный набор проверок
```

Полная команда `verify` запускает `verify:fast`, Knip, JSCPD, все Vitest projects, а затем
Playwright E2E.
Lefthook форматирует staged files и использует `verify:fast` для pre-commit checks.

GitLab CI запускает `verify:fast` и Vitest на отдельных stages. Pipeline не выполняет standalone
Playwright E2E и не создаёт готовую к deployment Next.js-сборку. `.gitlab/deploy.yaml` содержит
только закомментированный template, поэтому pipeline не публикует release artifact и ничего не
развёртывает. Будущий deploy job должен самостоятельно собрать или получить immutable bundle.
Подробности находятся в [правилах тестирования](docs/testing-guidelines.md) и
[руководстве по развёртыванию](docs/deployment.md).

## Служебные endpoints

- Health: `/api/health`
- Readiness: `/api/ready`
- Prometheus metrics: `/api/metrics`

Health и readiness сейчас всегда возвращают `200`; readiness не проверяет upstream dependencies.
Для локальной production-проверки выполните `npm run build`, затем `npm run prod`.

## Документация

Начните с [индекса документации](docs/README.md). Основные документы:

- [Архитектура](docs/architecture.md)
- [Переменные окружения](docs/environment.md)
- [Генерация API-клиента](docs/api-codegen.md)
- [BFF proxy](docs/bff-proxy.md)
- [Режим моков](docs/mock-mode.md)
- [Кеширование и streaming](docs/cache-and-streaming.md)
- [Компоненты `@repo/core`](docs/core-ui.md)
- [Правила тестирования](docs/testing-guidelines.md)
- [Конфигурация Oxlint](docs/oxlint-rules.md)
- [Развёртывание](docs/deployment.md)
