# Next.js Starter

Стартовый проект на Next.js для production: общие компоненты, типизированный API-клиент,
наблюдаемость и браузерные тесты.

## Быстрый старт

Требования: Node.js 26.13.1 или новее в ветке 26.x и npm 11.x.

```bash
npx create-next-app@latest my-app --example https://github.com/webpractik/nextjs-starter --use-npm
cd my-app
npm ci
test -e .env || cp .env.example .env
npx lefthook install
npm run dev
```

Откройте <http://localhost:3000>, как задано в `.env.example`.

Существующий `.env` не перезаписывается и не дополняется: сверьте его с `.env.example`.
Next.js проверяет переменные при загрузке конфига. Заменяя локальные заглушки, следуйте
[справочнику переменных окружения](openwiki/operations/environment.md).

## Возможности

- Next.js 16 App Router, React 19, TypeScript 7 и Tailwind CSS 4.
- Cache Components включены; React Compiler работает только в production-сборках.
- UI и API находятся в `src/components/ui` и `src/api`; зависимости устанавливаются из корня.
- UI-примитивы в стиле Base UI/shadcn, безопасный вывод HTML и типизированная композиция
  TanStack Form в `#/components/ui`.
- Контракт OpenAPI 3.2, проверка Redocly и генерация Kubb 5: типы TypeScript, Fetch SDK,
  плоский SDK, схемы Zod, опции TanStack Query, фабрики Faker и теги кеша.
  Публичные точки входа: `#/api`, `/client`, `/query`, `/schemas`, `/mocks` и
  `/cache-tags`.
- [Режим моков](openwiki/development/mock-mode.md) работает на сервере и в браузере без бэкенда;
  транспорт удаляет префикс API перед сопоставлением сгенерированного маршрута.
- Sentry, OpenTelemetry, логи Adze и метрики Prometheus.
- Модульные и браузерные компонентные тесты Vitest, Playwright E2E и Storybook.
- Oxfmt, Oxlint, Knip, JSCPD, Lefthook и Commitizen.

Контракт Petstore в `src/api/openapi/` демонстрирует кодогенерацию, без бэкенда и обработчиков
Next.js. Kubb использует TypeScript 7 проекта без compiler hook; ограничения поддержки
OpenAPI 3.2 и проверки совместимости описаны в [API codegen](openwiki/development/api-codegen.md).

## Формы

`#/components/ui/form` экспортирует общую типизированную фабрику форм `useAppForm`. Она регистрирует
поля text, textarea, number, date, phone, checkbox, switch, select, radio-group и slider вместе с
`SubmitButton`.

Передавайте событие отправки нативной `<form>` экземпляру TanStack Form. Схемы Zod 4 поддерживают
Standard Schema и передаются напрямую, без адаптера:

```tsx
'use client'

import { z } from 'zod'

import { useAppForm } from '#/components/ui/form'

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
[справочнике `#/components/ui`](openwiki/ui/core.md).

## Проверка

```bash
npm run verify:fast # форматирование, lint и TypeScript
npm run test        # все Vitest projects
npm run test:e2e    # Playwright E2E с development server
npm run verify      # полный локальный набор проверок
```

`verify` запускает `verify:fast`, Knip, JSCPD, все проекты Vitest, затем Playwright E2E.
Перед коммитом Lefthook форматирует файлы в индексе Git и запускает `verify:fast`.

GitHub Actions и GitLab CI не настроены. Проверки и сборка запускаются локально командами выше.

## Служебные endpoints

- Health: `/api/health`
- Readiness: `/api/ready`
- Prometheus metrics: `/api/metrics`

Health и readiness сейчас всегда возвращают `200`; readiness не проверяет внешние зависимости.
Для локальной production-проверки выполните `npm run build`, затем `npm run prod`.

## Документация

Начните с [индекса документации](openwiki/quickstart.md):

- [Архитектура](openwiki/architecture/overview.md)
- [Переменные окружения](openwiki/operations/environment.md)
- [Генерация API-клиента](openwiki/development/api-codegen.md)
- [BFF proxy](openwiki/architecture/bff-proxy.md)
- [Режим моков](openwiki/development/mock-mode.md)
- [Кеширование и потоковый рендеринг](openwiki/architecture/cache-and-streaming.md)
- [Карта компонентов](COMPONENTS.md)
- [UI-примитивы и формы](openwiki/ui/core.md)
- [Правила тестирования](openwiki/testing/testing.md)
- [Развёртывание](openwiki/operations/deployment.md)
