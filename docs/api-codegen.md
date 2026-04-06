# API Codegen: OpenAPI + Redocly + Kubb

## Обзор

Пакет `packages/api` содержит пайплайн для генерации типизированного API-клиента из OpenAPI-спецификации:

1. **OpenAPI** — описание API в формате YAML (OpenAPI 3.0)
2. **Redocly** — линтинг и сборка спеки в единый файл
3. **Kubb** — генерация TypeScript-типов, fetch-клиентов, Zod-валидаторов и React Query хуков

## Структура пакета

```
packages/api/
├── openapi/              # Исходные спеки (разбиты по файлам)
│   ├── components/       # Переиспользуемые схемы, параметры, ответы
│   └── paths/            # Эндпоинты API
├── openapi.yaml          # Корневой файл спецификации
├── redocly.yaml          # Конфиг линтинга и бандлинга
├── kubb.config.ts        # Конфиг кодогенерации
├── fetch.client.ts       # Кастомный fetch-клиент (используется сгенерированным кодом)
├── bundled.yaml          # Собранная спека (генерируется Redocly)
└── codegen/              # Сгенерированный код (генерируется Kubb)
    ├── models/           # TypeScript интерфейсы и типы
    ├── zod/              # Zod-схемы валидации
    ├── hooks/            # React Query хуки (useQuery, useMutation, useSuspenseQuery)
    └── {tag}/            # Fetch-клиенты, сгруппированные по тегам
```

## Команды

```bash
# Из корня проекта
cd packages/api

# Полная генерация (бандлинг + кодогенерация)
bun run generate

# Только бандлинг спеки
bun run bundle

# Линтинг спеки
bun run lint:openapi
```

## Пайплайн генерации

```
openapi.yaml + openapi/{paths,components}
        │
        ▼
  Redocly bundle    →  bundled.yaml
        │
        ▼
  Kubb generate     →  codegen/
        │
        ├── models/     TypeScript типы (interface, asConst enums)
        ├── zod/        Zod-схемы (с coercion, mini-формат)
        ├── hooks/      React Query хуки
        └── {tag}/      Fetch-клиенты по тегам
```

## Работа со спецификацией

### Добавление нового эндпоинта

1. Опишите путь в `openapi/paths/` или напрямую в `openapi.yaml`
2. Добавьте переиспользуемые схемы в `openapi/components/`
3. Каждый эндпоинт должен иметь:
   - `operationId` (обязательно, Redocly выдаст ошибку)
   - `summary` (обязательно)
   - `description` (рекомендуется)
   - `tag` — определяет группировку в сгенерированном коде
4. Запустите `bun run generate`

### Правила Redocly

Конфиг `redocly.yaml` расширяет `recommended` и включает:

| Правило | Уровень | Описание |
|---|---|---|
| `no-unused-components` | warn | Неиспользуемые компоненты |
| `operation-operationId` | error | Обязательный operationId |
| `operation-summary` | error | Обязательный summary |
| `operation-description` | warn | Рекомендуемый description |
| `tag-description` | warn | Рекомендуемое описание тегов |

## Конфигурация Kubb

### Плагины и что они генерируют

| Плагин | Выход | Описание |
|---|---|---|
| `pluginOas` | `swagger/` | Валидация и парсинг спеки |
| `pluginTs` | `models/` | TypeScript интерфейсы, `asConst` enums, `date` для дат |
| `pluginClient` | `{tag}/` | Fetch-клиенты с Zod-парсингом ответов |
| `pluginZod` | `zod/` | Zod-схемы с coercion и inferred-типами |
| `pluginReactQuery` | `hooks/` | `useQuery` (GET), `useMutation` (POST/PUT/DELETE/PATCH), `useSuspenseQuery` |

### Ключевые настройки

- **Группировка по тегам** — весь сгенерированный код разделяется по OpenAPI-тегам
- **Fetch-клиент** — используется кастомный `fetch.client.ts` (не axios)
- **Zod mini** — компактный формат схем (`z.string()` вместо `z.object({...}).strict()`)
- **Coercion** — автоматическое приведение типов в Zod-схемах
- **Params** — `paramsType: 'object'`, параметры передаются объектом

## Fetch-клиент

Кастомный `fetch.client.ts` — обёртка над `globalThis.fetch`, которую используют все сгенерированные клиенты.

Выбор baseURL описан в [docs/bff-proxy.md](./bff-proxy.md).

## Использование сгенерированного кода

```typescript
// TypeScript типы
import type { Pet } from '@repo/api/codegen/models/pet'

// Zod-схемы
import { petSchema } from '@repo/api/codegen/zod/pet'

// Fetch-клиент
import { getPetById } from '@repo/api/codegen/pet/getPetById'

// React Query хуки
import { useGetPetByIdQuery } from '@repo/api/codegen/hooks/pet/useGetPetByIdQuery'
```

## Важно

- Папка `codegen/` — сгенерированный код, не редактируйте вручную
- После изменения спеки всегда запускайте `bun run generate`
- `bundled.yaml` — артефакт сборки, коммитится в репозиторий для удобства ревью
- Линтинг ESLint игнорирует `packages/api/codegen` и `packages/api/bundled.yaml`
