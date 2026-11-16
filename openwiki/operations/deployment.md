---
type: operations
title: Сборка и развёртывание
description: Сборка и развёртывание в Next.js Starter, конфигурация и ограничения.
tags: [nextjs, starter, operations]
sources:
  - id: openwiki-source-bb1ebe868e35e9e500714501
    resource: repo://Dockerfile
generated: { by: "codex", at: "2026-11-16T14:41:28.183Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T14:41:28.183Z
---

# Deployment

> Тип: how-to + ограничения · Статус: локальная сборка и запуск Docker проверены.
> Источник истины: `next.config.ts`, `Dockerfile` и Route Handlers

Next.js настроен с `output: 'standalone'` и рассчитан на Node.js 26.13.1+ в ветке 26.x.
Production-сборка и запуск standalone runner в Docker проверены локально. Конфигурации GitHub Actions и GitLab CI удалены; автоматического deployment нет.

## Локальная production-проверка

```bash
npm ci
cp .env.example .env
npm run build
npm run prod
```

Проверьте:

```bash
curl --fail http://localhost:3000/api/health
curl --fail http://localhost:3000/api/ready
curl --fail http://localhost:3000/api/metrics
```

`npm run prod` использует `next start`, контейнер — минимальный `.next/standalone/server.js`.
Это разные точки запуска одной сборки.

## Dockerfile

`Dockerfile` содержит этап установки зависимостей через `npm ci`, builder Next.js и standalone
runner. Runner копирует `.next/standalone`, `.next/static` и `public/`, работает от пользователя
`nextjs` и слушает порт `3000`. `.dockerignore` исключает секреты, зависимости и локальные отчёты.

Точные аргументы сборки задаёт `Dockerfile`. `NEXT_PUBLIC_*` фиксируются при сборке; обязательные
серверные переменные передаются также при запуске контейнера. Список — в
[environment.md](environment.md). Финальный этап не наследует окружение builder.

Успех локальной сборки Next.js не подтверждает сборку и запуск Docker-образа. Перед использованием
проверьте оба шага и health endpoints. Токен Sentry для загрузки карт исходников передавайте как
секрет сборки, не сохраняйте в слоях образа или публичных аргументах.

## Локальная сборка Docker

Сначала подготовьте `.env` по [справочнику окружения](environment.md). Следующая команда передаёт значения build arguments через окружение процесса, а токен Sentry только через BuildKit secret. Значения env не выводятся в терминал.

```bash
node --env-file=.env --input-type=module <<'JS'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const buildArguments = [...readFileSync('Dockerfile', 'utf8').matchAll(/^ARG (\w+)/gm)]
    .map((match) => match[1])
    .filter((name) => name !== 'NODE_VERSION')
const result = spawnSync('docker', [
    'build',
    '--secret', 'id=SENTRY_AUTH_TOKEN,env=SENTRY_AUTH_TOKEN',
    ...buildArguments.flatMap((name) => ['--build-arg', name]),
    '-t', 'nextjs-starter:local', '.',
], { stdio: 'inherit' })
if (result.error) throw result.error
process.exitCode = result.status ?? 1
JS
```

Запуск и проверка:

```bash
docker run --detach --name nextjs-starter-local --env-file .env \
  -e NODE_ENV=production -e PORT=3000 -e HOSTNAME=0.0.0.0 \
  -p 127.0.0.1:3118:3000 nextjs-starter:local
curl --fail http://localhost:3118/api/health
curl --fail http://localhost:3118/api/ready
curl --fail http://localhost:3118/api/metrics
FRONT_PORT=3118 PORT=3118 npm run test:e2e
docker rm --force nextjs-starter-local
```

E2E development configuration переиспользует уже работающий сервер. Дождитесь успешного health перед запуском тестов, чтобы они обращались к контейнеру. Если Docker не разрешает домены реестров пакетов, проверьте его DNS и сеть; не подменяйте успешной локальной сборкой проверку образа.

## Автоматизация

GitHub Actions, включая расписание OpenWiki, и GitLab CI удалены по решению проекта. Проверки выполняются локально через `npm run verify`, генерация проверяется отдельно через `npm run api:gen:check`. OpenWiki обновляется вручную; CI-файлы не следует восстанавливать автоматически.

## Health, readiness и metrics

| Endpoint       | Текущее поведение                             | Чего не гарантирует                      |
| -------------- | --------------------------------------------- | ---------------------------------------- |
| `/api/health`  | Всегда JSON `{ "message": "OK" }`, status 200 | Доступность backend, Sentry или storage  |
| `/api/ready`   | Всегда JSON `{ "message": "OK" }`, status 200 | Готовность зависимостей и прогрев cache  |
| `/api/metrics` | Возвращает текущий Prometheus registry        | Authentication и network-level isolation |

Используйте health для проверки жизнеспособности процесса. Readiness пока эквивалентна ей:
не управляйте трафиком в расчёте на проверку зависимостей. Непубличные метрики закройте на ingress или в сети.

## Reverse proxy и browser API

В production приложение передаёт `X-Accel-Buffering: no` для отключения буферизации потоковых ответов прокси.
Проверяйте ingress отдельно: он может переопределить заголовок, тайм-ауты и сжатие.

В production браузер обращается к `NEXT_PUBLIC_BACK_URL` напрямую. CSP
`connect-src 'self' data: wss: ws:` не разрешает произвольные HTTPS-origin бэкенда и Sentry даже
при правильном CORS. До запуска выберите same-origin URL либо согласованно расширьте CSP и
проверьте CORS/cookies. Не ослабляйте CSP до `*`.

## Observability и privacy

- Сервер регистрирует OTEL и Sentry; клиентский Sentry запускается только в production.
- `tracesSampleRate` сейчас равен `1` на сервере и клиенте.
- Клиентский Sentry явно задаёт `dataCollection`: cookies, user info, query parameters,
  HTTP headers/bodies, stack variables и контекст исходников, а также данные database, GenAI и
  GraphQL для интеграций, которые их собирают. Настройки находятся в `instrumentation-client.ts`.
- Реестр Prometheus локален для процесса: реплики отдают разные снимки.

Перед production проверьте стоимость семплирования, сроки хранения, согласия, правила обработки
персональных данных и доставку Sentry через CSP. Без проверки нельзя заявлять соответствие требованиям проекта.

## Release checklist

1. Выполнить `npm ci`, полную проверку и production-сборку в чистом окружении.
2. Собрать Docker-образ и проверить его запуск, если deployment использует контейнер.
3. Зафиксировать публичные URL при сборке, серверные секреты и URL при запуске.
4. Проверить CORS, атрибуты cookies и CSP для production-origin бэкенда и Sentry.
5. Проверить streaming через реальный ingress.
6. Определить смысл readiness и доступ к метрикам.
7. Проверить персональные данные и семплирование Sentry, загрузку карт исходников без утечки токена.
8. Добавить задачу развёртывания с откатом и отслеживанием происхождения артефакта.
9. Выполнить smoke-тесты `/api/health`, `/api/ready`, `/api/metrics` и ключевого сценария страницы/API.

## Связанные документы

- [Environment](environment.md)
- [BFF proxy](../architecture/bff-proxy.md)
- [Cache Components при self-hosting](../architecture/cache-and-streaming.md)
- [Testing guidelines](../testing/testing.md)

## Проверка 16 ноября 2026

Образ `nextjs-starter:verified` успешно собран из Dockerfile и запущен на порту 3118. Главная страница, health, readiness и metrics вернули 200; пять Playwright E2E прошли против контейнера. Подтверждены Node.js 26.13.1, UID 1001 и отсутствие файла `/app/.env` в образе. Предыдущая DNS-ошибка установки tzdata при повторной проверке не воспроизвелась. Это локальная проверка; внешний backend, Sentry и production ingress отдельно не проверялись.
