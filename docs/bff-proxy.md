# BFF proxy и API transport

> Тип: объяснение · Статус: актуально · Источник истины: `next.config.ts`, `proxy.ts` и
> `packages/api/fetch.client.ts`

Generated API clients используют один transport. Base URL выбирается по месту выполнения:

| Контекст            | Base URL                       | Источник               |
| ------------------- | ------------------------------ | ---------------------- |
| Server runtime      | Внутренний backend URL         | `BACK_INTERNAL_URL`    |
| Browser development | Относительный Next.js rewrite  | `NEXT_PUBLIC_BFF_PATH` |
| Browser production  | Публичный backend URL напрямую | `NEXT_PUBLIC_BACK_URL` |

## Development rewrite

`next.config.ts` создаёт `beforeFiles` rewrite:

```text
${NEXT_PUBLIC_BFF_PATH}/:path* → ${BACK_INTERNAL_URL}/:path*
```

При типовых локальных значениях запрос браузера к `/bff-api/pets` принимается Next.js и
проксируется на `http://localhost:8080/pets`. Server Components и другой server-side код сразу
обращаются к `BACK_INTERNAL_URL`, не проходя через публичный origin приложения.

Для работы rewrite обе переменные обязательны. Не хардкодьте `/bff-api` в application code.

## Production

В production browser client обращается к `NEXT_PUBLIC_BACK_URL` напрямую. Это означает:

- Next.js не является production API gateway для browser-запросов;
- backend должен разрешать фактический frontend origin в CORS;
- при `credentials: 'include'` backend должен отвечать конкретным
  `Access-Control-Allow-Origin`, а не `*`, и разрешать credentials;
- cross-site cookies требуют корректных `Domain`, `SameSite` и `Secure` атрибутов.

Если production должен скрывать backend, централизовать auth или работать только same-origin,
нужно отдельно изменить архитектуру base URL/rewrite. Текущая реализация этого не обещает.

Кроме CORS, учитывайте production CSP: текущий `connect-src` разрешает `self`, `data:`, `ws:` и
`wss:`, но не произвольный HTTPS backend origin. Cross-origin `NEXT_PUBLIC_BACK_URL` потребует
отдельного точечного изменения CSP либо same-origin deployment; иначе browser заблокирует запрос.

## Cookies и headers на сервере

Transport по умолчанию задаёт `credentials: 'include'`. В браузере это управляет cookie policy,
но server-side `fetch` не переносит cookies входящего Next.js request автоматически. Для
authenticated server call вызывающая сторона должна явно передать нужные безопасные headers или
создать server-only adapter. Не передавайте весь набор headers без фильтрации.

Transport:

- сериализует query object через `packages/api/search-params.ts`;
- не задаёт `Content-Type` для `FormData`, чтобы boundary сформировал runtime;
- задаёт `application/json` для остальных bodies;
- на non-2xx бросает `Error`, помещая parsed response в `cause`;
- для `204`, `205`, `304` или пустого body возвращает пустой объект на transport-уровне.

## `proxy.ts` и `x-url`

Корневой Next.js Proxy выполняет request logging и добавляет во внутренний request header `x-url`
с исходным URL страницы. Runtime mock mode использует этот header для определения текущего route
во время Server Component rendering.

Matcher исключает `/api`, Next.js static/image assets и metadata files. `x-url` — внутренний
служебный header, а не доверенный auth signal. Не принимайте решения авторизации на его основе.

Proxy pipeline и BFF rewrite — разные механизмы: первый обрабатывает page request и передаёт
headers дальше в Next.js, второй проксирует browser API URL на backend в development.

## Локальная конфигурация

```env
BACK_INTERNAL_URL=http://localhost:8080
NEXT_PUBLIC_BFF_PATH=/bff-api
NEXT_PUBLIC_BACK_URL=http://localhost:8080
```

После изменения env перезапустите dev server: публичные `NEXT_PUBLIC_*` значения могут быть
встроены при сборке. Полная таблица — в [environment reference](environment.md).
