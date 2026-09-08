# Mock mode

> Тип: руководство · Статус: актуально · Источники истины: `src/mock-mode/`,
> [`packages/api/client-config.ts`](../packages/api/client-config.ts),
> [`packages/api/mock-client.ts`](../packages/api/mock-client.ts) и generated mock routes.

Режим моков запускает сгенерированные API-клиенты без бэкенда: общий транспорт должен перехватить
запрос и вернуть данные Faker без сетевого вызова.

Режим удобен для локальной разработки, тестов и Storybook, но не заменяет бэкенд: мутации не
меняют последующие `GET`-ответы; CORS, аутентификация, cookies и реальная интеграция не проверяются.

## Известное ограничение browser development

Маршрут ожидает путь OpenAPI вроде `/pets`, но клиент передаёт URL с `NEXT_PUBLIC_BFF_PATH`, например
`/bff-api/pets`. `mock-client.ts` пока не удаляет префикс:
запрос завершится ошибкой `Mock response is not configured`. Серверный SDK с `/pets` работает.
Транспорт браузера нужно исправить отдельно; базовый URL с префиксом пути имеет ту же проблему.

> Важно для production: cookie и page allowlist там игнорируются, но явные
> `MOCK_MODE=true` или `NEXT_PUBLIC_MOCK_MODE=true` всё ещё включают mocks. В release оба флага
> должны быть `false`.

## Как проходит запрос

```text
SDK из @repo/api
    → generated Next.js client
    → packages/api/client-config.ts → apiFetch
    → проверка env, cookie и page allowlist
    → packages/api/mock-client.ts
    → scenario override, если он есть
    → generated mock route
    → generated Faker factory
    → нативный Response с x-mock-mode: true
    → обычный Hey API parser и Zod response validation
```

`apiFetch` перехватывает запрос до `globalThis.fetch`. Если URL совпал с маршрутом, нативный
`Response` проходит парсер и валидатор Hey API как ответ бэкенда, без сети.

## Как включить mock mode

| Способ                       | Server | Browser  | Где действует                               |
| ---------------------------- | ------ | -------- | ------------------------------------------- |
| `MOCK_MODE=true`             | Да     | Fallback | Во всём process/build                       |
| `NEXT_PUBLIC_MOCK_MODE=true` | Нет    | Да       | Во всём browser bundle                      |
| Cookie `mock-mode=true`      | Да     | Да       | Только вне production                       |
| `mockModePagePaths`          | Да     | Да       | Только для разрешённых pages вне production |

Колонка Browser указывает место чтения флага, не отменяя ограничения BFF-префикса при сопоставлении.

Флаги окружения разбирает `z.stringbool()` без учёта регистра: `true`, `1`, `yes`, `on`,
`y` и `enabled` включают моки; `false`, `0`, `no`, `off`, `n` и `disabled` выключают. В релизе
задавайте `false`. Для cookie допустимо только точное `true`.

После изменения окружения перезапустите сервер разработки: `NEXT_PUBLIC_*` могут быть встроены в сборку.

### Через `.env`

Чтобы включить моки на сервере и в браузере:

```env
MOCK_MODE=true
NEXT_PUBLIC_MOCK_MODE=true
```

Для рабочего серверного режима оставьте публичный флаг `false`. Без `NEXT_PUBLIC_MOCK_MODE`
браузерная схема использует `MOCK_MODE`, но при разработке запрос по-прежнему упирается в
ограничение BFF-префикса.

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
намеренно игнорируется. В production cookie не включает моки.

### Для отдельных pages

Оба массива в `src/mock-mode/config.ts` по умолчанию пусты: сам маршрут моки не включает.

```ts
export const mockModePagePaths = ['/demo', /^\/preview(?:\/|$)/]
export const mockModeExcludedPagePaths = ['/demo/live']
```

При сопоставлении действуют правила:

- строка совпадает с самим путём и вложенными путями;
- `RegExp` выполняется в том виде, в котором записан;
- исключение всегда приоритетнее разрешения.

Сервер определяет страницу по служебному заголовку `x-url` из корневого `proxy.ts`. Меняя proxy,
сохраните заголовок или одновременно обновите режим моков.

## Сгенерированные маршруты

`npm --workspace @repo/api run gen` перезаписывает
`packages/api/codegen/mock-client-routes.ts`. Текущий контракт Petstore создаёт:

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
npm --workspace @repo/api run gen
```

Не редактируйте сгенерированную таблицу маршрутов вручную.

## Сценарии ответов

Сценарий задаёт cookie `mock-scenario`; на сервере её можно явно передать через `headers` SDK.
Имя проверяется по `BaseMockScenarioName`: неизвестное сохраняет обычный сгенерированный ответ без ошибки запроса.

Пока доступен только `default` с пустым списком переопределений. Чтобы добавить сценарий:

1. Расширьте объединение `BaseMockScenarioName` в `packages/api/mock-scenarios.ts`.
2. Добавьте массив `MockRoute[]` в `mockScenarios`.
3. Используйте фабрики из `@repo/api/mocks` для данных ответа.
4. Проверьте тестами приоритет, статус и данные.
5. Опишите сценарий здесь, если он становится частью публичного использования.

Маршруты сценария проверяются первыми и могут переопределить сгенерированный `method/path`.
Не включайте учётные, персональные и production-данные в сгенерированные или ручные фикстуры.

Cookie `mock-scenario` не включает моки, но может выбрать разрешённое переопределение, если флаг окружения
случайно включил их в production.

## Ограничения и безопасность

- Production игнорирует cookie `mock-mode` и список разрешённых страниц на сервере и в браузере.
- Флаги окружения работают и в production: в релизе оба должны быть явно `false`.
- Список страниц по умолчанию пуст. Вне production cookie включает браузерный флаг, но
  BFF-префикс по-прежнему мешает сопоставлению API-маршрута.
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
npm --workspace @repo/api run test
npm --workspace @repo/api run gen
npm run tsc
```

После изменения OpenAPI прочитайте diff сгенерированных маршрутов. Мок-тесты не заменяют проверку
реальной интеграции с бэкендом и E2E — запускайте их отдельно.

## Связанные документы

- [API codegen](api-codegen.md)
- [Переменные окружения](environment.md)
- [BFF proxy](bff-proxy.md)
- [Тестирование](testing-guidelines.md)
