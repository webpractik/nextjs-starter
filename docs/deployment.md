# Развёртывание

> Назначение: быстро понять, какой способ запуска уже проверен и что ещё нужно сделать перед
> production.
>
> Статус: конфигурация Compose, Valkey integration и cache matrix обоих режимов проверены
> локально; gateway/browser smoke и GitLab deploy остаются отдельными задачами.

Приложение собирается как Next.js standalone-сервер для Node.js 24. Поддерживаемый локальный путь —
`npm run build` и `npm run prod`. Compose описывает две Next.js-реплики, общий эфемерный Valkey и
Traefik gateway; development использует source mounts, production — один standalone image и
non-root runner.

## Что можно использовать сейчас

| Задача                        | Текущий статус                  | Куда перейти                             |
| ----------------------------- | ------------------------------- | ---------------------------------------- |
| Собрать production            | Build и Compose image проверены | [Запуск standalone](run-standalone.md)   |
| Проверить dev/prod config     | Проверено с `.env.example`      | [Docker Compose](docker-compose.md)      |
| Проверить Valkey handler      | Integration: 4 tests            | `npm run test:cache:integration`         |
| Проверить две Next.js-реплики | Dev/prod cache matrix проверен  | Cache matrix из Docker Compose guide     |
| Развернуть из GitLab CI       | Не настроено                    | `.gitlab-ci.yml`, `.gitlab/deploy.yaml`  |
| Проверить готовность релиза   | Ручной checklist                | [Release и rollback](release-runbook.md) |

Для локальной standalone-проверки используйте [отдельную пошаговую инструкцию](run-standalone.md),
а для Compose и cache matrix — [локальное руководство](docker-compose.md).

## Docker и Compose

Dockerfile содержит отдельные targets:

| Target        | Назначение                                                   |
| ------------- | ------------------------------------------------------------ |
| `development` | `next dev` с исходниками                                     |
| `builder`     | Production build с обязательными build-time переменными      |
| `runner`      | Минимальный standalone runtime от пользователя без root-прав |

`.dockerignore` исключает локальные env-файлы, зависимости, результаты сборки и test artifacts.
`SENTRY_AUTH_TOKEN` попадает в builder через BuildKit secret, а не через Docker build argument.
Build загружает cache handler для валидации, но handler работает в build mode без обращения к
Valkey. Реальный URL и общий namespace передаются только запущенным репликам.

Compose-файлы описывают две реплики `nextjs` и общий Valkey за одним Traefik gateway. Gateway
публикует host-порт, а реплики и Valkey доступны только внутри Docker network. `compose.dev.yaml`
выбирает development target и локальные mounts; `compose.prod.yaml` — standalone runner без
исходников. Valkey не публикует host port, не имеет persistent volume, запускается без RDB/AOF и с
`volatile-ttl` eviction policy.

### Что проверено для текущей реализации

Проверка 2 августа 2026 года подтвердила:

- нормализацию development и production Compose configs с актуальным `.env.example`;
- `npm run test:cache:integration`: четыре tests handler против временного Valkey, включая shared
  entries, immediate/profiled/soft-tag invalidation, удаление повреждённой entry и восстановление
  после outage;
- cleanup изолированной test topology после integration run;
- `npm run build` и production Compose build после подключения Valkey handler;
- startup двух healthy Next.js-реплик и healthy Valkey в development и production;
- полный development и production cache matrix: shared hit между репликами, immediate
  invalidation, recreation одной Next.js replica, cold cache после recreation Valkey, fresh
  rendering при outage и явный `503` test invalidation;
- cache metrics на обеих репликах без namespace, probe key или payload в labels/output;
- `npm run verify:cache:compose`, включая missing-env и unhealthy-Valkey startup failures.

Matrix обращается к application containers напрямую и не проверяет Traefik, HMR/Fast Refresh,
browser console или TLS. Для production smoke используйте `localhost` или реальный TLS ingress:
на HTTP-адресе nip.io CSP `upgrade-insecure-requests` повышает asset-запросы до HTTPS, а локальный
Traefik TLS не завершает.

Matrix harness сам собирает свежий image выбранного режима, создаёт отдельный Compose project,
использует случайные namespace/token и удаляет containers, network и anonymous volumes в `finally`.

### Rollback shared cache

Valkey хранит только производный cache, поэтому миграция данных при rollback не нужна:

1. Верните предыдущий immutable application image либо удалите только
   `cacheHandlers.default` из `next.config.ts` и пересоберите все реплики одним artifact.
2. Переключите обе реплики одновременно: смешанный release с разными cache contracts не должен
   использовать один namespace.
3. Проверьте fresh rendering, health/readiness и application latency. In-memory default handler
   снова будет независимым в каждом процессе.
4. Только после остановки всех реплик, использующих Valkey handler, удалите service. Текущая server
   schema всё ещё требует `VALKEY_URL` и `VALKEY_CACHE_NAMESPACE`: сохраняйте валидные значения,
   пока тот же artifact не удалит эти требования и Compose dependency. Старые keys можно не
   очищать: они исчезнут по TTL или вместе с ephemeral container.
5. Для отката только несовместимого cache format верните предыдущий image вместе с его namespace;
   смена namespace всегда означает cold cache и требует запаса source capacity.

Остановить локальную Compose topology можно командой `make compose-down`; изолированные integration
и matrix scripts выполняют эквивалентный cleanup автоматически даже после failure.

### Почему это ещё не production-ready

- Valkey — единственная общая точка отказа. Persistence намеренно выключена: restart, recreation и
  eviction дают cold cache. Поведение `volatile-ttl`, memory overhead и defaults `128mb`/`192m` под
  реальной нагрузкой не проверены.
- Compose Valkey не включает authentication или TLS и безопасен только пока `6379` остаётся внутри
  изолированной network. Для внешнего managed endpoint нужен `rediss:`/credentials и отдельная
  проверка.
- `VALKEY_CACHE_NAMESPACE` должен быть одинаковым у всех реплик release. Rotation не удаляет старые
  keys сразу, а смена namespace создаёт cold cache; нужен operational процесс и capacity allowance.
- Cache reads и writes деградируют при backend error, но invalidation сообщает ошибку вызывающему
  коду. `/api/ready` Valkey не проверяет, поэтому healthy replica может работать без shared cache.
- `SENTRY_AUTH_TOKEN` попадает в builder как BuildKit secret, но базовый Compose-файл пока передаёт
  token и в runtime environment. Перед production token должен остаться только build secret.
- Traefik читает Docker socket. Даже read-only mount даёт чувствительный доступ к Docker API;
  ограничьте доступ к host или используйте отдельный socket proxy.
- Gateway работает на одном Docker host и не завершает TLS. Две реплики не дают high availability
  при отказе host или gateway.
- Prometheus registry остаётся отдельным в каждой реплике, а Valkey server metrics exporter не
  настроен. Подробности — в [справочнике наблюдаемости](observability.md).

Не копируйте реальный `.env` в image и не обходите env validation фиктивными production values.
Build-time и runtime contract описан в [environment.md](environment.md).

## GitLab CI

Pipeline содержит три stages: `codequality`, `test` и пустой `deploy`.

- `codequality` запускает `npm run verify:fast`.
- `test` устанавливает Chromium и запускает оба Vitest projects через `npm run test`.
- Focused `npm run test:cache:integration` и dev/prod cache matrix отдельны и в pipeline не входят.
- Production build и standalone Playwright E2E в CI не запускаются.
- `.gitlab/deploy.yaml` содержит только заготовку: deploy job и artifact отсутствуют.

Будущий deploy job должен собирать или получать immutable artifact. Подключить его к существующему
`.next` нельзя: pipeline такой artifact сейчас не создаёт.

## Служебные endpoints

Семантика `/api/health`, `/api/ready` и `/api/metrics` описана в
[справочнике наблюдаемости](observability.md). Для deployment важно, что readiness пока не
проверяет зависимости, а metrics нужно закрыть на уровне сети или ingress.

`/api/cache-probe` существует только для изолированных cache matrix: по умолчанию выключен,
требует `CI=true`, непроизводственный `APP_ENV` и отдельный token. Не включайте его как обычный
production endpoint.

## Перед production release

1. Синхронизируйте deployment env с `.env.example` и проверьте оба Compose config.
2. Выполните focused Valkey integration и dev/prod cache matrix.
3. Выполните `npm ci` и `npm run verify` в чистом окружении.
4. Соберите и smoke-test production image; сохраните immutable artifact с Git SHA или digest.
5. Проверьте build-time public URLs, runtime secrets, namespace rotation и memory/eviction limits.
6. Проверьте CORS, cookies, CSP, streaming и telemetry через реальный ingress.
7. Определите readiness, доступ к metrics, shutdown и правила для нескольких реплик.
8. Добавьте deploy job и проверяемый rollback на предыдущий artifact.
9. Выполните [release runbook](release-runbook.md).

## Связанные документы

- [Переменные окружения](environment.md)
- [Docker Compose](docker-compose.md)
- [BFF proxy](bff-proxy.md)
- [Запуск standalone](run-standalone.md)
- [Self-hosting](self-hosting.md)
- [Безопасность](security.md)
- [Наблюдаемость](observability.md)
