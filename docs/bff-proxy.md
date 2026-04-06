# BFF-проксирование

## Как работает

Fetch-клиент (`packages/api/fetch.client.ts`) выбирает baseURL в зависимости от окружения:

| Контекст | baseURL | Переменная |
|---|---|---|
| Сервер (всегда) | Внутренний URL бэкенда | `BACK_INTERNAL_URL` |
| Клиент, dev | Через Next.js rewrite-прокси | `NEXT_PUBLIC_BFF_PATH` |
| Клиент, prod | Напрямую к бэкенду | `NEXT_PUBLIC_BACK_URL` |

В dev-режиме клиентские запросы идут на относительный путь `/bff-api/*`, который Next.js через rewrite проксирует на `BACK_INTERNAL_URL`. Это позволяет обойти CORS при локальной разработке.

В prod-режиме клиент обращается к бэкенду напрямую по `NEXT_PUBLIC_BACK_URL`, rewrite не используется.

## Локальная разработка с внешним бэкендом (RC/DEV)

Чтобы подключиться к бэкенду на площадке, укажите в `.env`:

```env
BACK_INTERNAL_URL=https://api.rc.example.com
NEXT_PUBLIC_BACK_URL=https://api.rc.example.com
```

Клиентские запросы пойдут через BFF-прокси (`/bff-api` → `BACK_INTERNAL_URL`), серверные — напрямую.
