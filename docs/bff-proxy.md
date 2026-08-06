# Как API-запрос доходит до backend

> Тип: объяснение · Статус: актуально · Источники истины:
> [`next.config.ts`](../next.config.ts), [`proxy.ts`](../proxy.ts) и
> [`packages/api/client-config.ts`](../packages/api/client-config.ts)

**Когда читать:** если запрос уходит не на тот URL, падает только в production или теряет cookie
на сервере.

## Короткий ответ

Активный Hey API client получает config из `client-config.ts` и выбирает base URL по месту
выполнения:

| Откуда идёт запрос    | Куда он идёт                                        |
| --------------------- | --------------------------------------------------- |
| Server runtime        | На `BACK_INTERNAL_URL` напрямую                     |
| Browser в development | На `NEXT_PUBLIC_BFF_PATH`, затем через Next rewrite |
| Browser в production  | На `NEXT_PUBLIC_BACK_URL` напрямую                  |

В локальном примере ниже `/bff-api/pets` проходит через Next.js, а Server Component сразу вызывает
`http://localhost:8080/pets`.

## Development: запрос проходит через rewrite

Только в development `next.config.ts` создаёт `beforeFiles` rewrite:

```text
${NEXT_PUBLIC_BFF_PATH}/:path* → ${BACK_INTERNAL_URL}/:path*
```

Обе переменные обязательны. `NEXT_PUBLIC_BFF_PATH` начинается с `/` и не содержит пустых сегментов,
завершающего `/`, query или fragment. API base URLs также не содержат завершающего `/`, query или
fragment.

Не хардкодьте `/bff-api` в коде приложения.

## Production: браузер вызывает backend напрямую

В production `rewrites()` возвращает пустой массив. Запрос из браузера идёт на
`NEXT_PUBLIC_BACK_URL`, поэтому:

- backend должен разрешать реальный frontend origin в CORS;
- при `credentials: 'include'` нельзя отвечать `Access-Control-Allow-Origin: *`; нужно указать
  конкретный origin и разрешить credentials;
- для cross-site cookies нужны правильные `Domain`, `SameSite` и `Secure`;
- CSP `connect-src` должен разрешать backend origin.

Сейчас `connect-src` не разрешает произвольный HTTPS origin. Скрытый backend, централизованный auth
или обязательный same-origin потребуют отдельного архитектурного изменения.

## Cookies и headers на сервере

Client config использует `credentials: 'include'`, но server-side `fetch` не переносит cookies
входящего запроса Next.js. Для authenticated server call передайте только нужные headers или
создайте server-only adapter; не копируйте все входящие headers.

## Что ещё делает client

- Hey API сериализует `path`, `query` и `body`; массивы query передаются повторяющимися ключами.
- Runtime config по умолчанию задаёт `credentials: 'include'` и custom `apiFetch`.
- `cache`, `signal`, headers и `next: { tags, revalidate }` доходят до native Fetch без потери.
- Успешный JSON проходит generated Zod response validation; `204` возвращает `data: undefined`.
- По умолчанию SDK возвращает discriminated result `{ data, error, response }`; при
  `throwOnError: true` documented parsed error бросается.
- При совпадении mock route `apiFetch` возвращает native `Response`, который разбирает тот же
  generated client.

Основные SDK-вызовы импортируются из `@repo/api`, low-level client — из `@repo/api/client`.
Request shape и result modes описаны в [справочнике API codegen](api-codegen.md).

## `proxy.ts` и `x-url` — другой механизм

Next.js Proxy логирует page request и добавляет header `x-url`. Runtime mock mode использует его,
чтобы определить текущий route при рендеринге Server Component.

Matcher исключает `/api`, `/_next/static`, `/_next/image`, `favicon.ico`, `sitemap.xml` и
`robots.txt`. Другие metadata routes, например `manifest.webmanifest`, сейчас явно не исключены и
могут пройти через proxy. `x-url` — служебный header, а не сигнал авторизации.

Proxy и BFF rewrite не заменяют друг друга:

- proxy обрабатывает запрос страницы и передаёт headers в Next.js;
- rewrite только в development перенаправляет browser API URL на backend.

## Локальный пример

```env
BACK_INTERNAL_URL=http://localhost:8080
NEXT_PUBLIC_BFF_PATH=/bff-api
NEXT_PUBLIC_BACK_URL=http://localhost:8080
```

После изменения env перезапустите dev server: значения `NEXT_PUBLIC_*` могут быть встроены при
сборке. Все переменные описаны в [справочнике окружения](environment.md).
