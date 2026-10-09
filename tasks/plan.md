# План миграции Hey API → Kubb 5

Дата исходного плана: 2026-09-10. Актуализация после реализации: 2026-10-09.
Пользователь расширил задачу обновлением всех зависимостей проекта до последних стабильных
релизов и разрешил commit/push. Итоговые проверки и ограничения приведены в
[отчёте](../docs/dependency-updates.md); состояние этапов — в [todo.md](todo.md).

## Цель и принятые границы

Перевести `@repo/api` на Kubb 5, сохранив неизменный OpenAPI 3.2.0, шесть публичных facets,
SDK с `path`/`query`/`body`, native Fetch/Response, Query composition, Zod, Faker, mocks и cache tags.
Обновить прямые зависимости корня и обоих workspaces через npm, зафиксировать exact versions
и воспроизводимый lockfile. Runtime остаётся Node.js 24.

Не добавлять Axios, MSW или другой пакетный менеджер. Проверять сгенерированные файлы корневым
TypeScript 7 в существующем строгом режиме. Изменения исходного `next-env.d.ts` остаются вне коммита.

## Проверенный инструментальный набор

| Пакет                 | Exact version | Назначение                          |
| --------------------- | ------------- | ----------------------------------- |
| `kubb`                | 5.5.6         | CLI и pipeline                      |
| `@kubb/adapter-oas`   | 5.5.6         | Чтение OpenAPI                      |
| `@kubb/plugin-ts`     | 5.0.5         | Типы и `as const` enums             |
| `@kubb/plugin-zod`    | 5.4.3         | Zod 4 schemas                       |
| `@kubb/plugin-client` | 5.5.4         | SDK поверх проектного Fetch-клиента |
| `@kubb/plugin-faker`  | 5.1.0         | Faker factories                     |

Плагины выпускаются независимо; одинаковый номер версии для всех пакетов не требуется.
Прямой TypeScript 6 workspace и resolution hook Hey API удалены. Внутренняя compiler dependency
плагина Kubb допустима: весь output проверяется root TypeScript 7.0.2.

## Изменения решения после исполняемой проверки

1. Встроенный валидатор Kubb не поддерживает полный OpenAPI 3.2. Обязательный Redocly lint
   проверяет неизменённый контракт, а постгенератор сравнивает версию и используемые операции,
   методы, пути, path-параметры, теги, response statuses и наличие тела с AST адаптера.
   Это доказательство текущего Petstore-поднабора, а не всей спецификации 3.2.
2. Для SDK выбран `plugin-client`: операции генерируются с прежними grouped options поверх
   небольшого universal Fetch runtime. Не требуются отдельные wrappers на каждую операцию.
   Сохраняются `data/error/response`, parsed HTTP errors, ZodError и `204 → undefined`.
3. Официальный `plugin-react-query` ориентирован на plugin-fetch/plugin-axios. Query factories
   генерируются из контракта и Kubb operation types проектным helper. Ключи содержат tags,
   параметры и base URL; Query фиксирует адрес ключа и передаёт cancellation в Fetch.
   Infinite Query заменяет только `offset`, а policy следующей страницы задаёт потребитель.
4. Faker нормализуется после генерации: `options.faker` передаётся вложенным вызовам без
   изменения глобального экземпляра. Public aliases и manifest factories генерируются;
   отсутствие ожидаемого status factory останавливает pipeline.
5. Synthetic unknown response Kubb для bodyless `204` заменяется на `undefined` в types и
   schemas с проверкой формы output. Object schemas сохраняют прежнее удаление лишних полей.
6. Browser mock routing удаляет настроенный base path перед сопоставлением с `/pets`.
   Исправление отдельно подтверждено development consumer с относительным BFF URL.
7. Обновление Next.js, Vitest, Storybook, Sentry и остальных библиотек входит в расширенную
   задачу. `partialPrefetching: false` сохраняет прежнее поведение Cache Components; production
   React Compiler остаётся включён только в production.

## Порядок реализации и приёмки

1. Сохранить исходное дерево и проверить baseline API tests/root tsc.
2. Проверить Kubb на неизменном bundle 3.2 без скрытой 3.1-копии.
3. Настроить types/Zod/Faker/SDK, затем типизированный Fetch runtime и public aliases.
4. Подключить Query, request-local Faker, mock routes и существующие cache tags.
5. Переключить основной pipeline; удалить Hey API, его compiler hook и workspace dependency.
6. Обновить все manifests и npm lockfile; проверить registry latest и чистый `npm ci`.
7. Проверить SDK errors/validation/204, pagination/cancellation, schemas/factories и public types.
8. Проверить browser React Query consumer и SDK в Server/Client Components отдельного Next.js
   приложения в development и production. В основном приложении не добавлять demo route.
9. Добавить `gen:check` в GitLab codequality: полный gen и сравнение имён/SHA-256 всех файлов,
   включая hidden, added и deleted output; затем существующий `verify:fast`.
10. Повторить tests, lint, tsc, formatter, build, Storybook и E2E; провести dependency audit,
    просмотреть diff и записать отдельно незелёные дополнительные проверки.
11. Закоммитить только изменения миграции/обновления и отправить в существующий `origin/main`.

## Итоговый pipeline

```text
OpenAPI 3.2.0 и $ref
    → Redocly lint + bundle
    → Kubb types + Zod + client + Faker
    → AST parity + Query/facets + cache tags + mock routes
    → два прохода Oxfmt generated output
    → root TypeScript 7
    → runtime tests + browser/Next consumers + gen:check
```

Generated implementation находится в `codegen/`; runtime и конфиги — вне очищаемого output.
Ручные правки generated files запрещены. Контракт, публичные импорты и текущие ограничения
описаны в [api-codegen.md](../docs/api-codegen.md).
