# Как API-запрос доходит до backend

> Тип: объяснение · Статус: актуально · Источники истины:
> [`next.config.ts`](../next.config.ts), [`proxy.ts`](../proxy.ts) и
> [`packages/api/client-config.ts`](../packages/api/client-config.ts)

## Короткий ответ

Клиент Hey API использует `client-config.ts` и выбирает базовый URL по месту
выполнения:

| Откуда идёт запрос    | Куда он идёт                                        |
| --------------------- | --------------------------------------------------- |
| Server runtime        | На `BACK_INTERNAL_URL` напрямую                     |
| Browser в development | На `NEXT_PUBLIC_BFF_PATH`, затем через Next rewrite |
| Browser в production  | На `NEXT_PUBLIC_BACK_URL` напрямую                  |

В локальном примере `/bff-api/pets` проходит через Next.js, а Server Component сразу вызывает
`http://localhost:8080/pets`.

## Development: запрос проходит через rewrite

Только в development `next.config.ts` создаёт `beforeFiles` rewrite:

```text
${NEXT_PUBLIC_BFF_PATH}/:path* → ${BACK_INTERNAL_URL}/:path*
```

Обе переменные обязательны. `NEXT_PUBLIC_BFF_PATH` начинается с `/` и не содержит пустых сегментов,
завершающего `/`, строки запроса или фрагмента. Базовые URL API тоже не содержат завершающего `/`,
строки запроса или фрагмента.

Не задавайте `/bff-api` напрямую в приложении.

## Production: браузер вызывает backend напрямую

В production `rewrites()` возвращает пустой массив. Запрос из браузера идёт на
`NEXT_PUBLIC_BACK_URL`, поэтому:

- бэкенд должен разрешать реальный origin фронтенда в CORS;
- при `credentials: 'include'` нельзя отвечать `Access-Control-Allow-Origin: *`; нужно указать
  конкретный origin и разрешить credentials;
- для межсайтовых cookies нужны правильные `Domain`, `SameSite` и `Secure`;
- CSP `connect-src` должен разрешать origin бэкенда.

Сейчас `connect-src` не разрешает произвольный HTTPS-origin. Скрыть бэкенд, централизовать
аутентификацию или обеспечить обязательный same-origin можно лишь изменением архитектуры.

## Cookies и headers на сервере

Конфиг задаёт `credentials: 'include'`, но серверный `fetch` не переносит cookies входящего
запроса Next.js. Для аутентификации передавайте только нужные заголовки или создайте server-only
адаптер; не копируйте все входящие заголовки.

## Что ещё делает client

- Hey API сериализует `path`, `query` и `body`; массивы в строке запроса — повторяющимися ключами.
- Конфиг по умолчанию задаёт `credentials: 'include'` и собственный `apiFetch`.
- `cache`, `signal`, заголовки и `next: { tags, revalidate }` передаются нативному Fetch без потерь.
- Успешный JSON проверяется сгенерированной схемой Zod; `204` возвращает `data: undefined`.
- SDK по умолчанию возвращает результат `{ data, error, response }` с различимыми ветвями; при
  `throwOnError: true` выбрасывает разобранную ошибку, описанную в контракте.
- При совпадении маршрута мока `apiFetch` возвращает нативный `Response` для того же
  сгенерированного клиента.

Импортируйте SDK из `@repo/api`, низкоуровневый клиент — из `@repo/api/client`.
Форматы запросов и результатов — в [справочнике кодогенерации API](api-codegen.md).

## `proxy.ts` и `x-url` — другой механизм

Next.js Proxy логирует запрос страницы и добавляет `x-url` для определения маршрута моками
при рендеринге Server Component.

Matcher исключает `/api`, `/_next/static`, `/_next/image`, `favicon.ico`, `sitemap.xml` и
`robots.txt`. Другие маршруты метаданных, например `manifest.webmanifest`, явно не исключены и
могут пройти через proxy. `x-url` — служебный заголовок, а не признак авторизации.

Proxy и BFF rewrite не заменяют друг друга:

- proxy обрабатывает запрос страницы и передаёт заголовки в Next.js;
- rewrite перенаправляет браузерные API-запросы на бэкенд только в development.

## Локальный пример

```env
BACK_INTERNAL_URL=http://localhost:8080
NEXT_PUBLIC_BFF_PATH=/bff-api
NEXT_PUBLIC_BACK_URL=http://localhost:8080
```

После изменения окружения перезапустите сервер разработки: `NEXT_PUBLIC_*` могут встраиваться
при сборке. См. [справочник окружения](environment.md).
