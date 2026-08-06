# Mock mode

> Тип: руководство · Статус: актуально · Источники истины: `src/mock-mode/`,
> [`packages/api/client-config.ts`](../packages/api/client-config.ts),
> [`packages/api/mock-client.ts`](../packages/api/mock-client.ts) и generated mock routes.

**Когда читать:** чтобы запустить SDK без backend, выбрать mock scenario или проверить, почему
запрос не дошёл до сети.

Mock mode предназначен для запуска generated API clients без backend. Общий transport
перехватывает запрос и должен вернуть generated Faker data без сетевого вызова.

Это удобно для локальной разработки, тестов и Storybook. Mock mode не заменяет backend: мутации не
меняют последующие `GET`-ответы, а CORS, auth, cookies и реальную интеграцию он не проверяет.

## Известное ограничение browser development

Generated route ожидает OpenAPI path вроде `/pets`, а client передаёт в mock transport URL с
`NEXT_PUBLIC_BFF_PATH`, например `/bff-api/pets`. `mock-client.ts` пока не снимает этот prefix,
поэтому такой запрос завершится ошибкой `Mock response is not configured`. Server SDK с path
`/pets` работает. Browser transport нужно исправить отдельно; base URL с собственным path prefix
имеет то же ограничение.

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

`apiFetch` перехватывает уже сформированный запрос до `globalThis.fetch`. Если URL совпал с
generated route, native `Response` проходит тот же Hey API parser и validator, что и ответ backend,
и сетевой backend не нужен.

## Как включить mock mode

| Способ                       | Server | Browser  | Где действует                               |
| ---------------------------- | ------ | -------- | ------------------------------------------- |
| `MOCK_MODE=true`             | Да     | Fallback | Во всём process/build                       |
| `NEXT_PUBLIC_MOCK_MODE=true` | Нет    | Да       | Во всём browser bundle                      |
| Cookie `mock-mode=true`      | Да     | Да       | Только вне production                       |
| `mockModePagePaths`          | Да     | Да       | Только для разрешённых pages вне production |

Колонка Browser показывает, где читается переключатель. Она не отменяет описанное выше
ограничение BFF-prefix при сопоставлении generated route.

Env-флаги проходят через `z.stringbool()`. Без учёта регистра значения `true`, `1`, `yes`, `on`,
`y` и `enabled` включают mocks; `false`, `0`, `no`, `off`, `n` и `disabled` выключают. В release
используйте явное `false`. Cookie строже: mock mode включает только точное значение `true`.

После изменения env перезапустите dev server. Значения `NEXT_PUBLIC_*` могут быть встроены в build.

### Через `.env`

Чтобы включить флаг mock mode и на сервере, и в браузере:

```env
MOCK_MODE=true
NEXT_PUBLIC_MOCK_MODE=true
```

Для рабочего server-only режима оставьте public flag равным `false`. Если
`NEXT_PUBLIC_MOCK_MODE` вообще не задан, browser schema использует `MOCK_MODE` как fallback, но в
development browser request всё равно сталкивается с текущим ограничением BFF-prefix.

### Через cookie

В локальной browser console:

```js
document.cookie = 'mock-mode=true; Path=/; SameSite=Lax'
document.cookie = 'mock-scenario=default; Path=/; SameSite=Lax'
```

Чтобы отключить:

```js
document.cookie = 'mock-mode=; Path=/; Max-Age=0; SameSite=Lax'
document.cookie = 'mock-scenario=; Path=/; Max-Age=0; SameSite=Lax'
```

Browser mechanism читает `document.cookie`, поэтому `HttpOnly` cookie для него не подходит.
Query parameter `mock-scenario` намеренно игнорируется. В production cookie не включает mock
mode.

### Для отдельных pages

По умолчанию оба массива в `src/mock-mode/config.ts` пусты: один только route ничего не включает.

```ts
export const mockModePagePaths = ['/demo', /^\/preview(?:\/|$)/]
export const mockModeExcludedPagePaths = ['/demo/live']
```

Правила matching:

- строка совпадает с самим path и его descendants;
- `RegExp` выполняется в том виде, в котором записан;
- exclusion всегда имеет приоритет над allowlist.

На сервере текущий page определяется по внутреннему header `x-url`, который добавляет корневой
`proxy.ts`. Если меняете proxy pipeline, сохраните этот header или одновременно обновите mock
mode.

## Сгенерированные маршруты

`npm --workspace @repo/api run gen` перезаписывает
`packages/api/codegen/mock-client-routes.ts`. Текущий Petstore contract создаёт:

| Метод    | Pattern         | Status по умолчанию |
| -------- | --------------- | ------------------- |
| `GET`    | `/pets`         | `200`               |
| `POST`   | `/pets`         | `201`               |
| `GET`    | `/pets/<petId>` | `200`               |
| `PATCH`  | `/pets/<petId>` | `200`               |
| `DELETE` | `/pets/<petId>` | `204`               |

Query string не участвует в route matching. Generated factory учитывает generated types, но сама
по себе не моделирует фильтрацию, pagination или сохранение состояния.

`mock-client-routes.ts` — generated output. Чтобы добавить операцию, измените OpenAPI и
перегенерируйте API:

```bash
npm --workspace @repo/api run gen
```

Не редактируйте generated route table вручную.

## Сценарии ответов

Scenario выбирается через cookie `mock-scenario`. На сервере cookie можно передать явно в
`headers` SDK options. Имя проверяется по allowlist `BaseMockScenarioName`: неизвестное
значение не ломает запрос, а оставляет обычный generated response.

Сейчас доступен только scenario `default`, и его override list пуст. Чтобы добавить новый:

1. Расширьте union `BaseMockScenarioName` в `packages/api/mock-scenarios.ts`.
2. Добавьте массив `MockRoute[]` в `mockScenarios`.
3. Используйте factories из `@repo/api/mocks` для response data.
4. Добавьте тесты на precedence, status и data.
5. Опишите scenario здесь, если он становится частью публичного workflow.

Scenario routes проверяются раньше generated routes и могут переопределить конкретный
`method/path`. Не помещайте в generated или ручные fixtures credentials, PII и production data.

Cookie `mock-scenario` сама по себе не включает mocks. Но если environment flag случайно включил
mock mode в production, разрешённая scenario cookie сможет выбрать override.

## Ограничения и безопасность

- Production игнорирует `mock-mode` cookie и page allowlist на server и browser.
- Явные env flags работают и в production, поэтому в release оба должны быть `false`.
- Page allowlist пуст по умолчанию; вне production cookie включает browser flag, но API-вызов с
  BFF-prefix всё равно попадает под текущее ограничение сопоставления route.
- По умолчанию нет latency, network errors, persistence, pagination semantics и error scenarios.
- Server и browser могут работать в разных режимах из-за разных flags или cookies.
- Успешный mock response не доказывает совместимость с реальным backend.

## Как проверить изменение

Для runtime logic:

```bash
npx vitest run src/mock-mode/runtime.unit.test.ts --project unit
npx vitest run src/mock-mode/runtime.component.test.ts --project component
```

Для transport, scenarios или generated routes:

```bash
npm --workspace @repo/api run test
npm --workspace @repo/api run gen
npm run tsc
```

После изменения OpenAPI прочитайте diff generated routes. Реальную backend-интеграцию и E2E
проверяйте отдельно: mock tests их не заменяют.

## Связанные документы

- [API codegen](api-codegen.md)
- [Переменные окружения](environment.md)
- [BFF proxy](bff-proxy.md)
- [Тестирование](testing-guidelines.md)
