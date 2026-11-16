---
type: guide
title: Runtime mocks
description: Runtime mocks в Next.js Starter, конфигурация и ограничения.
tags: [nextjs, starter, guide]
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T14:24:53.735Z
sources:
  - id: openwiki-source-efec11b1a4dae3b601863151
    resource: repo://src/api/client-config.ts
  - id: openwiki-source-656b2f5f268fed6917e9ab64
    resource: repo://src/api/mock-client.ts
  - id: openwiki-source-16c5cb08094990fd837eb7df
    resource: repo://src/api/mock-scenarios.ts
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
---

# Mock mode

> Тип: руководство · Статус: актуально · Источники истины: `src/mock-mode/`,
> [`src/api/client-config.ts`](../../src/api/client-config.ts),
> [`src/api/mock-client.ts`](../../src/api/mock-client.ts) и сгенерированные маршруты моков.

Режим моков запускает сгенерированные API-клиенты без бэкенда. Общий транспорт перехватывает
запрос и возвращает данные Faker без сетевого вызова.

Используйте режим для локальной разработки, тестов и Storybook. Мутации не меняют последующие
`GET`-ответы. Режим не проверяет CORS, аутентификацию, cookies и реальную интеграцию с бэкендом.

## Префикс API и сопоставление маршрутов

Сгенерированные маршруты используют пути OpenAPI, например `/pets`. Перед передачей запроса в
`mock-client.ts` функция `createMockRequestConfig` удаляет pathname выбранного API base URL.
В development браузерный `/bff-api/pets` сопоставляется с `/pets`. Серверный или production URL
с префиксом пути обрабатывается так же. Удаляется только полный префикс на границе сегмента,
query string сохраняется. Обычный сетевой запрос вне mock mode не изменяется.

> В production cookie и список разрешённых страниц игнорируются, но явные
> `MOCK_MODE=true` или `NEXT_PUBLIC_MOCK_MODE=true` включают моки. В релизе оба флага
> должны быть `false`.

## Как проходит запрос

```text
SDK из #/api
    → Kubb SDK и проектный Fetch client
    → src/api/client-config.ts → apiFetch
    → проверка env, cookie и page allowlist
    → src/api/mock-client.ts
    → scenario override, если он есть
    → generated mock route
    → generated Faker factory
    → нативный Response с x-mock-mode: true
    → обычный Fetch parser и Zod response validation
```

`apiFetch` перехватывает запрос до `globalThis.fetch`. Если URL совпал с маршрутом, нативный
`Response` проходит парсер и сгенерированный валидатор Zod как ответ бэкенда, без сети.

## Как включить mock mode

| Способ                       | Server | Browser  | Где действует                               |
| ---------------------------- | ------ | -------- | ------------------------------------------- |
| `MOCK_MODE=true`             | Да     | Fallback | Во всём процессе или сборке                       |
| `NEXT_PUBLIC_MOCK_MODE=true` | Нет    | Да       | Во всём браузерном bundle                      |
| Cookie `mock-mode=true`      | Да     | Да       | Только вне production                       |
| `mockModePagePaths`          | Да     | Да       | Только для разрешённых страниц вне production |

Колонка Browser указывает место чтения флага. Транспорт моков выполняется до Next.js rewrite.

Флаги окружения разбирает `z.stringbool()` без учёта регистра. Значения `true`, `1`, `yes`, `on`,
`y` и `enabled` включают моки, а `false`, `0`, `no`, `off`, `n` и `disabled` выключают. В релизе
задавайте `false`. Для cookie допустимо только точное `true`.

После изменения окружения перезапустите сервер разработки. Значения `NEXT_PUBLIC_*` могут быть встроены в сборку.

### Через `.env`

Чтобы включить моки на сервере и в браузере:

```env
MOCK_MODE=true
NEXT_PUBLIC_MOCK_MODE=true
```

Для моков только на сервере задайте публичный флаг `NEXT_PUBLIC_MOCK_MODE=false`.
Если публичная переменная отсутствует, браузерная схема использует `MOCK_MODE` как fallback.

### Через cookie

В локальной консоли браузера:

```js
document.cookie = 'mock-mode=true; Path=/; SameSite=Lax'
document.cookie = 'mock-scenario=default; Path=/; SameSite=Lax'
```

Чтобы отключить:

```js
document.cookie = 'mock-mode=; Path=/; Max-Age=0; SameSite=Lax'
document.cookie = 'mock-scenario=; Path=/; Max-Age=0; SameSite=Lax'
```

Браузер читает `document.cookie`, поэтому `HttpOnly` не подходит. Параметр запроса `mock-scenario`
игнорируется. В production cookie не включает моки.

### Для отдельных pages

Оба массива в `src/mock-mode/config.ts` по умолчанию пусты. Сам маршрут моки не включает.

```ts
export const mockModePagePaths = ['/demo', /^\/preview(?:\/|$)/]
export const mockModeExcludedPagePaths = ['/demo/live']
```

При сопоставлении действуют правила:

- строка совпадает с самим путём и вложенными путями;
- `RegExp` выполняется как записан;
- исключение всегда приоритетнее разрешения.

Сервер определяет страницу по служебному заголовку `x-url` из корневого `proxy.ts`. Меняя proxy,
сохраните заголовок или одновременно обновите режим моков.

## Сгенерированные маршруты

`npm run api:gen` перезаписывает
`src/api/codegen/mock-client-routes.ts`. Текущий контракт Petstore создаёт:

| Метод    | Pattern         | Status по умолчанию |
| -------- | --------------- | ------------------- |
| `GET`    | `/pets`         | `200`               |
| `POST`   | `/pets`         | `201`               |
| `GET`    | `/pets/<petId>` | `200`               |
| `PATCH`  | `/pets/<petId>` | `200`               |
| `DELETE` | `/pets/<petId>` | `204`               |

Строка запроса не участвует в сопоставлении маршрута. Сгенерированная фабрика учитывает типы,
но не моделирует фильтрацию, пагинацию и сохранение состояния.

`mock-client-routes.ts` генерируется. Добавляйте операции через OpenAPI и повторную генерацию:

```bash
npm run api:gen
```

Не редактируйте сгенерированную таблицу маршрутов вручную.

## Сценарии ответов

Сценарий задаёт cookie `mock-scenario`. На сервере её можно явно передать через `headers` SDK.
Имя проверяется по `BaseMockScenarioName`. При неизвестном имени используется обычный
сгенерированный ответ без ошибки запроса.

Пока доступен только `default` с пустым списком переопределений. Чтобы добавить сценарий:

1. Расширьте объединение `BaseMockScenarioName` в `src/api/mock-scenarios.ts`.
2. Добавьте массив `MockRoute[]` в `mockScenarios`.
3. Используйте фабрики из `#/api/mocks` для данных ответа.
4. Проверьте тестами приоритет, статус и данные.
5. Опишите сценарий здесь, если он становится частью публичного использования.

Маршруты сценария проверяются первыми и могут переопределить сгенерированный `method/path`.
Не включайте учётные, персональные и production-данные в сгенерированные или ручные фикстуры.

Cookie `mock-scenario` не включает моки, но может выбрать разрешённое переопределение, если флаг окружения
случайно включил их в production.

## Ограничения и безопасность

- Production игнорирует cookie `mock-mode` и список разрешённых страниц на сервере и в браузере.
- Флаги окружения работают и в production. В релизе оба должны быть явно `false`.
- Список страниц по умолчанию пуст. Вне production cookie включает моки для текущего браузера.
- По умолчанию не моделируются задержки, сетевые ошибки, хранение состояния, пагинация и сценарии ошибок.
- Флаги и cookies могут задать разные режимы серверу и браузеру.
- Успешный мок не доказывает совместимость с реальным бэкендом.

## Как проверить изменение

Для логики выбора режима:

```bash
npx vitest run src/mock-mode/runtime.unit.test.ts --project unit
npx vitest run src/mock-mode/runtime.component.test.ts --project component
```

Для транспорта, сценариев или сгенерированных маршрутов:

```bash
npm run api:test
npm run api:gen
npm run tsc
```

После изменения OpenAPI прочитайте diff сгенерированных маршрутов. Отдельно запускайте проверку
реальной интеграции с бэкендом и E2E. Мок-тесты их не заменяют.

## Связанные документы

- [API codegen](api-codegen.md)
- [Переменные окружения](../operations/environment.md)
- [BFF proxy](../architecture/bff-proxy.md)
- [Тестирование](../testing/testing.md)
