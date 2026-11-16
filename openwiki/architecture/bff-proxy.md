---
type: architecture
title: BFF и API transport
description: BFF и API transport в Next.js Starter, реальные контракты и рабочие сценарии.
tags: [nextjs, starter, architecture]
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:52:45.490Z
sources:
  - id: openwiki-source-50a18d054b596a7ed0eeffb0
    resource: repo://next.config.ts
  - id: openwiki-source-efec11b1a4dae3b601863151
    resource: repo://src/api/client-config.ts
  - id: openwiki-source-42a666b0018181a5115f3d41
    resource: repo://src/proxy/chain.ts
  - id: openwiki-source-60bc468a60b6d1b32461958e
    resource: repo://src/proxy/inject-headers.ts
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
---

# Как API-запрос доходит до backend

> Тип: объяснение · Статус: актуально · Источники истины:
> [`next.config.ts`](../../next.config.ts), [`proxy.ts`](../../proxy.ts) и
> [`src/api/client-config.ts`](../../src/api/client-config.ts)

## Короткий ответ

Fetch-клиент Kubb использует `client-config.ts`. Базовый URL зависит от места выполнения:

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

В production `rewrites()` возвращает пустой массив. Браузер отправляет запрос на
`NEXT_PUBLIC_BACK_URL`. Для этого нужны следующие настройки:

- бэкенд должен разрешать реальный origin фронтенда в CORS;
- при `credentials: 'include'` нельзя отвечать `Access-Control-Allow-Origin: *`; нужно указать
  конкретный origin и разрешить credentials;
- для межсайтовых cookies нужны правильные `Domain`, `SameSite` и `Secure`;
- CSP `connect-src` должен разрешать origin бэкенда.

Сейчас `connect-src` не разрешает произвольный HTTPS-origin. Чтобы скрыть бэкенд,
централизовать аутентификацию или сделать same-origin обязательным, нужно изменить архитектуру.

## Cookies и headers на сервере

Конфиг задаёт `credentials: 'include'`, но серверный `fetch` не переносит cookies входящего
запроса Next.js. Для аутентификации передавайте только нужные заголовки или создайте server-only
адаптер. Не копируйте все входящие заголовки.

## Что ещё делает client

- Проектный Fetch-клиент сериализует `path`, `query` и `body`. Массивы в строке запроса передаются повторяющимися ключами.
- Конфиг по умолчанию задаёт `credentials: 'include'` и собственный `apiFetch`.
- Клиент передаёт `cache`, `signal`, заголовки и `next: { tags, revalidate }` нативному Fetch без потерь.
- Клиент проверяет успешный JSON сгенерированной схемой Zod. Для `204` он возвращает `data: undefined`.
- SDK по умолчанию возвращает результат `{ data, error, response }` с различимыми ветвями. При
  `throwOnError: true` выбрасывает разобранную ошибку, описанную в контракте.
- При совпадении маршрута мока `apiFetch` возвращает нативный `Response` для того же
  сгенерированного клиента.

Импортируйте SDK из `#/api`, а низкоуровневый клиент из `#/api/client`.
Форматы запросов и результатов описаны в [справочнике кодогенерации API](../development/api-codegen.md).

<a id="proxyts-и-x-url--другой-механизм"></a>

## `proxy.ts` и служебный заголовок `x-url`

Next.js Proxy логирует запрос страницы и добавляет `x-url` для определения маршрута моками
при рендеринге Server Component.

Matcher исключает `/api`, `/_next/static`, `/_next/image`, `favicon.ico`, `sitemap.xml` и
`robots.txt`. Другие маршруты метаданных, например `manifest.webmanifest`, явно не исключены и
могут пройти через proxy. `x-url` содержит служебные данные и не подтверждает авторизацию.

Proxy и BFF rewrite не заменяют друг друга:

- proxy обрабатывает запрос страницы и передаёт заголовки в Next.js;
- rewrite перенаправляет браузерные API-запросы на бэкенд только в development.

## Локальный пример

```env
BACK_INTERNAL_URL=http://localhost:8080
NEXT_PUBLIC_BFF_PATH=/bff-api
NEXT_PUBLIC_BACK_URL=http://localhost:8080
```

После изменения окружения перезапустите сервер разработки. Значения `NEXT_PUBLIC_*` могут
встраиваться при сборке. Подробности приведены в [справочнике окружения](../operations/environment.md).
