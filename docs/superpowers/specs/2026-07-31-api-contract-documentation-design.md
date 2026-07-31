# Контракт Petstore и реструктуризация документации

**Статус:** согласовано 31 июля 2026 года

**Область:** `packages/api`, корневая документация и `docs/`

## Контекст

В репозитории отсутствует канонический OpenAPI-файл, поэтому Redocly lint и Kubb generation не
работают. Одновременно README, инструкции для агентов и документы в `docs/` смешивают фактическое,
целевое и экспериментальное состояния проекта. В результате часть заявленных возможностей не
соответствует исполняемым конфигам.

Изменение восстанавливает минимальный пример API-контракта и перестраивает документацию вокруг
проверяемого текущего состояния.

## Цели

- Добавить канонический примерный Petstore-контракт на OpenAPI 3.2.0.
- Проверить прямую обработку OpenAPI 3.2 текущими Redocly и Kubb без преобразования версии.
- Сделать pipeline lint → bundle → codegen воспроизводимым.
- Зафиксировать понятную политику исходных и сгенерированных API-артефактов.
- Разделить документацию по назначению и устранить известные противоречия.
- Добавить справочники по environment, deployment, mock mode и тестированию.

## Вне области изменения

- Реализация backend для примерного Petstore API.
- Добавление UI-страниц с Petstore-примерами.
- Включение `cacheComponents`.
- Перестройка BFF, Docker, GitLab CI, observability или тестовой инфраструктуры.
- Исправление существующего нарушения границ между `packages/api` и корневым `src/`.
- Автоматическое понижение OpenAPI 3.2 до OpenAPI 3.1 для Kubb.

Обнаруженные проблемы вне этой области документируются как ограничения, но не исправляются попутно.

## API-контракт

### Структура источников

```text
packages/api/openapi/
├── openapi.yaml
├── paths/
│   ├── pets.yaml
│   └── pets-by-id.yaml
└── components/
    ├── parameters/
    │   ├── limit.yaml
    │   ├── offset.yaml
    │   ├── pet-id.yaml
    │   └── pet-status.yaml
    ├── responses/
    │   ├── not-found.yaml
    │   └── validation-error.yaml
    └── schemas/
        ├── create-pet.yaml
        ├── pet-page.yaml
        ├── pet-status.yaml
        ├── pet.yaml
        ├── problem.yaml
        └── update-pet.yaml
```

`openapi.yaml` является единственной точкой входа и содержит `openapi: 3.2.0`, метаданные,
относительный server URL, описание tag `pets` и `$ref` на paths/components.

### Операции

| Метод    | Путь            | `operationId`      | Успешный ответ | Назначение                             |
| -------- | --------------- | ------------------ | -------------- | -------------------------------------- |
| `GET`    | `/pets`         | `findPetsByStatus` | `200 PetPage`  | Фильтрация и offset-пагинация питомцев |
| `POST`   | `/pets`         | `createPet`        | `201 Pet`      | Создание питомца                       |
| `GET`    | `/pets/{petId}` | `getPetById`       | `200 Pet`      | Получение питомца                      |
| `PATCH`  | `/pets/{petId}` | `updatePet`        | `200 Pet`      | Частичное обновление                   |
| `DELETE` | `/pets/{petId}` | `deletePet`        | `204`          | Удаление питомца                       |

`findPetsByStatus` сохраняет существующий Kubb override для infinite query. Он принимает:

- `status` — необязательный массив значений `available`, `pending`, `sold`;
- `offset` — целое число от нуля, по умолчанию `0`;
- `limit` — целое число от `1` до `100`, по умолчанию `20`.

`PetPage` содержит `items`, `offset`, `limit` и `total`. Идентификатор питомца — непустая строка.
`CreatePet` требует `name`; `UpdatePet` разрешает частичное изменение `name` и `status`, но требует
хотя бы одно поле. Ошибки используют единый объект `Problem` с `status`, `code`, `title` и
необязательным `detail`.

Каждая операция обязана иметь уникальный `operationId`, `summary`, `description`, tag, описанные
ответы и примеры. Контракт не заявляет authentication, потому что это локальная демонстрационная
заглушка, а не модель production API.

### OpenAPI 3.2 и Kubb

OpenAPI 3.2 передаётся текущему Kubb 4.39.2 напрямую. Kubb официально документирует OpenAPI только
до 3.1, поэтому это осознанный совместимый эксперимент.

Ограничения:

- контракт использует совместимое с OpenAPI 3.1 подмножество Schema Object;
- pipeline не переписывает поле `openapi` и не создаёт скрытую 3.1-копию;
- успешная генерация и TypeScript-проверка являются обязательным доказательством совместимости;
- если генерация не проходит, работа останавливается с зафиксированным blocker, а версия контракта
  не понижается без нового решения.

### Pipeline и артефакты

```text
openapi/openapi.yaml + $ref-файлы
    → Redocly lint
    → Redocly bundle
    → bundled.yaml
    → Kubb
    → codegen/
```

Политика хранения:

- `openapi/` коммитится и является источником истины;
- `codegen/` коммитится, но никогда не редактируется вручную;
- `bundled.yaml` остаётся игнорируемым промежуточным артефактом;
- изменение контракта всегда сопровождается повторной генерацией;
- Kubb сохраняет `output.clean: true`, поэтому ручные файлы внутри `codegen/` запрещены.

## Структура документации

Документация остаётся плоской в `docs/`, чтобы сохранить короткие стабильные пути. В начале каждого
документа указываются назначение и фактический статус. `docs/README.md` становится навигационной
точкой входа.

| Документ                      | Тип                    | Содержание и источник истины                                 |
| ----------------------------- | ---------------------- | ------------------------------------------------------------ |
| `docs/README.md`              | Навигация              | Индекс, аудитория, тип, статус и владелец каждого раздела    |
| `docs/architecture.md`        | Объяснение             | Только фактические слои и правила размещения кода            |
| `docs/api-codegen.md`         | How-to                 | Petstore contract, Redocly, Kubb и generated artifacts       |
| `docs/cache-and-streaming.md` | Объяснение/ограничения | Cache Components выключен; только проверенные semantics      |
| `docs/bff-proxy.md`           | Объяснение             | Фактическая матрица base URL, CORS/cookies и headers         |
| `docs/environment.md`         | Справочник             | Env-схемы, `.env.example`, Docker и реальные потребители     |
| `docs/deployment.md`          | How-to                 | Standalone, Docker, GitLab CI, health/readiness              |
| `docs/mock-mode.md`           | How-to + справочник    | Runtime mock pipeline, cookies, scenarios и generated routes |
| `docs/testing-guidelines.md`  | Справочник             | Vitest projects, Playwright, Storybook и naming patterns     |

### Обновление существующих документов

`README.md` остаётся англоязычной публичной точкой входа. Он показывает только фактические
возможности, использует `npm ci`, разделяет готовые и экспериментальные функции и ссылается на
`docs/README.md`.

`CLAUDE.md` остаётся англоязычным, но сокращается до Claude-specific указаний и ссылки на
`AGENTS.md`. Дублирующиеся версии, команды и описания конфигов удаляются.

`AGENTS.md` остаётся основным русскоязычным operational reference. Из него удаляются устранённые
расхождения; правила OpenAPI обновляются под 3.2 и новую artifact policy. Контракт
`fetch.client.ts` описывает два уровня: transport возвращает `ResponseConfig<TData>`, а
сгенерированные Kubb-клиенты возвращают `TData`.

`architecture.md` описывает текущее дерево и реальные зависимости. CASL, Socket.IO, Zustand и
несуществующие каталоги не выдаются за установленную архитектуру; полезные паттерны расширения
либо удаляются, либо явно маркируются как необязательные примеры.

`cache-and-streaming.md` начинается с предупреждения, что `cacheComponents` выключен. Из документа
удаляются ссылки на отсутствующие страницы, исправляются `cacheLife`, `'use cache: private'`,
`updateTag`, `revalidateTag`, Error Boundary и Server Action semantics. Документ не рекомендует
cache-only архитектуру как действующий проектный default.

### Новые документы

`environment.md` содержит таблицу с именем переменной, областью server/client, обязательностью,
моментом чтения build/runtime, потребителем и безопасным примером. Секреты не дублируются в client
schema. Отдельно описываются BFF URL, mock mode, Sentry и test-only `FRONT_PORT`.

`deployment.md` описывает поддерживаемый standalone flow, локальную production-проверку,
Docker stages, build args, runtime variables и GitLab pipeline. Health и readiness описываются по
их фактической семантике; документ не обещает проверку зависимостей, которой нет в коде.

`mock-mode.md` объясняет server/client flags, cookies `mock-mode` и `mock-scenario`, определение
текущего route через `x-url`, allow/exclude rules, generated `mock-client-routes.ts` и безопасное
отключение моков в production.

`testing-guidelines.md` фиксирует точные file patterns для unit, component и E2E tests, различия
Node и browser environments, способы запуска одного файла, test env loading, Storybook и выбор
минимальной проверки по типу изменения.

## Ссылки и терминология

- Основной язык `docs/` и `AGENTS.md` — русский; идентификаторы и код остаются английскими.
- README и CLAUDE остаются английскими.
- Термины `Server Component`, `Client Component`, `Cache Components`, `Server Action` и названия
  API не переводятся, но при первом использовании получают русское пояснение.
- Все относительные ссылки должны разрешаться локально.
- Кодовые блоки получают language identifier.
- Целевое или экспериментальное поведение всегда явно отделяется от текущего.

## Ошибки и ограничения

- Невалидный OpenAPI останавливает pipeline на Redocly lint.
- Ошибка bundle или Kubb generation не маскируется сохранённым старым `codegen/`.
- Генерация OpenAPI 3.2 не считается поддержанной только потому, что parser прочитал файл: должны
  пройти полный generation pipeline и TypeScript check.
- Документация описывает несовершенные текущие health/readiness и deployment contracts честно;
  исправление их поведения требует отдельного изменения.
- Существующие пользовательские изменения рабочего дерева не включаются в изменение случайно.

## Проверка результата

После реализации выполняются:

```bash
npm --workspace @repo/api run lint:openapi
npm --workspace @repo/api run gen
npm --workspace @repo/api run test
npm run tsc
npm run lint
npx oxfmt --check <изменённые-файлы>
```

Дополнительно проверяются:

- отсутствие незакоммиченного generation drift после повторного `gen`;
- разрешение всех локальных Markdown-ссылок;
- соответствие документированных env names реальным Zod-схемам и конфигам;
- отсутствие ссылок на несуществующие примеры и generated import paths;
- diff только в согласованной области.
