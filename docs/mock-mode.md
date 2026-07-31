# Runtime mock mode

> Тип: how-to + справочник · Статус: доступен, opt-in · Источник истины:
> `src/mock-mode/`, `packages/api/fetch.client.ts`, `mock-client.ts` и generated mock routes

Mock mode перехватывает вызовы generated API clients внутри общего transport и возвращает
generated Faker data без network request. Он подходит для локальной разработки, tests и Storybook,
но не реализует stateful backend: `POST`, `PATCH` и `DELETE` не меняют последующие `GET` responses.

## Pipeline

```text
generated client
    → packages/api/fetch.client.ts
    → проверка env/cookie/page allowlist
    → packages/api/mock-client.ts
    → scenario override (если есть)
    → codegen/mock-client-routes.ts
    → generated Faker factory
    → ResponseConfig<TData> с x-mock-mode: true
```

Mock check выполняется до выбора base URL и до `globalThis.fetch`, поэтому backend не требуется.

## Способы включения

| Механизм                     | Server | Browser  | Область действия                        |
| ---------------------------- | ------ | -------- | --------------------------------------- |
| `MOCK_MODE=true`             | Да     | Fallback | Весь process/build                      |
| `NEXT_PUBLIC_MOCK_MODE=true` | Нет    | Да       | Весь browser bundle                     |
| Cookie `mock-mode=true`      | Да     | Да       | Конкретный browser/session request      |
| `mockModePagePaths`          | Да     | Да       | Разрешённые page paths и их descendants |

Environment flags требуют перезапуска dev server; `NEXT_PUBLIC_*` может быть встроен в build.
Значением true считается только boolean `true` или строка `true` в соответствующей ветке.

### Через `.env`

```env
MOCK_MODE=true
NEXT_PUBLIC_MOCK_MODE=true
```

Для server-only сценария оставьте public flag `false`. Учитывайте, что browser schema использует
`MOCK_MODE` как fallback, если `NEXT_PUBLIC_MOCK_MODE` не задан.

### Через cookies

В browser console для локального окружения:

```js
document.cookie = 'mock-mode=true; Path=/; SameSite=Lax'
document.cookie = 'mock-scenario=default; Path=/; SameSite=Lax'
```

Отключение:

```js
document.cookie = 'mock-mode=; Path=/; Max-Age=0; SameSite=Lax'
document.cookie = 'mock-scenario=; Path=/; Max-Age=0; SameSite=Lax'
```

Cookie должна быть доступна `document.cookie`, поэтому текущий browser mechanism несовместим с
`HttpOnly`. Query parameter `mock-scenario` намеренно игнорируется.

### Через page allowlist

По умолчанию оба массива в `src/mock-mode/config.ts` пусты, поэтому route сам по себе mocks не
включает.

```ts
export const mockModePagePaths = ['/demo', /^\/preview(?:\/|$)/]
export const mockModeExcludedPagePaths = ['/demo/live']
```

String rule совпадает с самим path и descendants. RegExp проверяется целиком как задан. Exclusion
имеет приоритет над allowlist.

На server текущий page определяется по внутреннему header `x-url`, который добавляет корневой
`proxy.ts`. Не удаляйте этот header из proxy pipeline без одновременного изменения mock mode.

## Generated routes

`npm --workspace @repo/api run gen` перезаписывает
`packages/api/codegen/mock-client-routes.ts`. Для текущего Petstore contract создаются routes:

| Метод    | Pattern         | Default status |
| -------- | --------------- | -------------- |
| `GET`    | `/pets`         | `200`          |
| `POST`   | `/pets`         | `201`          |
| `GET`    | `/pets/<petId>` | `200`          |
| `PATCH`  | `/pets/<petId>` | `200`          |
| `DELETE` | `/pets/<petId>` | `204`          |

Query string не участвует в route matching. Generated factory может учитывать generated types, но
не моделирует фильтрацию, pagination state или persistence автоматически.

`mock-client-routes.ts` — generated output. Новую операцию добавляйте в OpenAPI, затем запускайте
`gen`; не редактируйте таблицу вручную.

## Scenarios

Scenario выбирается cookie `mock-scenario` либо cookie header, явно переданным server-side в
`RequestConfig.headers`. Значение проходит allowlist `BaseMockScenarioName`; неизвестное имя не
ломает request, а приводит к обычному generated response.

Сейчас существует только `default`, а его override list пуст. Для нового сценария:

1. расширьте union `BaseMockScenarioName` в `packages/api/mock-scenarios.ts`;
2. добавьте массив `MockRoute[]` в `mockScenarios`;
3. используйте generated factories для response data;
4. добавьте tests на precedence и нужные status/data;
5. обновите этот документ, если сценарий становится публичным workflow.

Scenario routes проверяются раньше generated routes, поэтому могут переопределять конкретный
method/path. Не размещайте generated или ручные fixtures с credentials, PII и production data.

## Ограничения и production safety

- Cookie `mock-mode=true` сейчас учитывается во всех environments. Значение
  `NEXT_PUBLIC_MOCK_MODE=false` не запрещает пользователю самостоятельно установить cookie.
- Page allowlist пуст по умолчанию, но cookie включает mocks глобально для этого browser.
- Нет latency, network errors, state persistence, pagination semantics или error scenarios по
  умолчанию.
- Server и browser могут оказаться в разных режимах при разных flags/cookies.
- Mock response не доказывает совместимость с реальным backend, CORS, auth или cookies.

До публичного production deployment нужно отдельно решить, допустим ли cookie override. Если нет,
добавьте environment guard в runtime code и regression tests; одной документации или значения
`false` в env недостаточно.

## Проверка

```bash
npx vitest run src/mock-mode/runtime.unit.test.ts --project unit
npm --workspace @repo/api run test
npm --workspace @repo/api run gen
npm run tsc
```

При изменении OpenAPI проверьте generated route diff и повторите реальный backend integration/E2E
отдельно от mock tests.

## Связанные документы

- [API codegen](api-codegen.md)
- [Environment](environment.md)
- [BFF proxy](bff-proxy.md)
- [Testing guidelines](testing-guidelines.md)
