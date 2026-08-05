# Наблюдаемость

> Назначение: справочник по логам, Sentry, OpenTelemetry, метрикам и служебным endpoints.
>
> Статус: базовые интеграции включены; доставка, alerts и privacy policy зависят от окружения.

## Что доступно

| Сигнал               | Реализация          | Ограничение                                  |
| -------------------- | ------------------- | -------------------------------------------- |
| Логи                 | Adze                | Pretty text, без централизованного transport |
| Server traces        | `registerOTel`      | Exporter задаёт платформа или окружение      |
| Server errors/traces | Sentry              | `tracesSampleRate: 1`                        |
| Client errors/traces | Sentry в production | CSP может блокировать Sentry origin          |
| Метрики              | `prom-client`       | Отдельный registry в каждом процессе         |
| Liveness             | `/api/health`       | Всегда `200`, без проверки зависимостей      |
| Readiness            | `/api/ready`        | Сейчас полностью совпадает с liveness        |
| Cache probe          | `/api/cache-probe`  | По умолчанию выключен; только test matrix    |

## Логи

Код приложения использует logger из `#/observability/logger`. Его текущие настройки: уровень
`info`, timestamp, pretty format и namespace из `APP_NAME`.

Не логируйте:

- cookies и authorization headers;
- пароли, access tokens и другие secrets;
- персональные данные и полный request body;
- весь набор переменных окружения.

Для связи событий используйте безопасный request ID или trace ID. Если deployment требует JSON,
добавьте и проверьте transport и схему в целевом log collector.

## Prometheus

`src/observability/metrics.ts` создаёт registry и добавляет default Node.js metrics с prefix из
`APP_NAME`. State хранится в `globalThis`, чтобы повторная загрузка module в одном процессе не
регистрировала метрики повторно. `/api/metrics` возвращает этот registry в Prometheus text format.

Cache handler регистрирует три семейства:

| Метрика                                        | Labels                 | Смысл                                           |
| ---------------------------------------------- | ---------------------- | ----------------------------------------------- |
| `${APP_NAME}_cache_operations_total`           | `operation`, `outcome` | Результаты `get` и `set`                        |
| `${APP_NAME}_cache_invalidations_total`        | `mode`, `outcome`      | Immediate/profiled tag invalidation             |
| `${APP_NAME}_cache_operation_duration_seconds` | `operation`            | Histogram latency `get`/`set`, buckets 5 ms–1 s |

Bounded outcomes для `get`: `build_miss`, `miss`, `hit`, `stale`, `expired`, `tag_expired`,
`decode_error`, `backend_error`. Для `set`: `build_skip`, `written`, `oversize`, `error`.
Invalidation использует mode `immediate` или `profiled` и outcome `success` или `error`.

`backend_error` на чтении означает cache miss с продолжением rendering; ошибка записи также не
прерывает вызывающий код. Ошибка invalidation учитывается отдельно и пробрасывается вызывающему
коду. Alerts должны различать эти semantics, а не объединять все outcomes в один error rate.

Endpoint не имеет authentication. Разрешайте его только monitoring network или scrape account.
При двух репликах нужно опрашивать обе: counters и gauges между процессами не синхронизируются.
Traefik endpoint с round-robin не заменяет явный scrape каждого target.

Application endpoint не экспортирует Valkey server statistics, memory usage, evictions или
connections. Compose не поднимает Valkey exporter; для этих сигналов нужен отдельный exporter или
managed-service integration.

Для новой метрики:

1. используйте существующий registry;
2. задайте стабильные name, help text и единицы измерения;
3. не добавляйте high-cardinality labels: email, request ID или URL с object ID;
4. добавьте test и настройте dashboard/alert вне репозитория;
5. зафиксируйте правила агрегации между репликами.

## Sentry и privacy

Server Sentry запускается в Node.js runtime с environment `${APP_ENV}-server`. Client Sentry
запускается только в production с `${NEXT_PUBLIC_APP_ENV}-client`.

Текущие важные настройки:

- `tracesSampleRate: 1` на server и client;
- `sendDefaultPii: true` на client;
- Session Replay не включён;
- source maps загружает Sentry build plugin, если задан `NEXT_PUBLIC_SENTRY_DSN`.

Перед production release проверьте sampling cost, consent, retention, data scrubbing и доступы в
Sentry. Разрешите точный ingest origin в CSP. Правила для build token и runtime secrets находятся
в [документе о безопасности](security.md#secrets-и-container-build).

## Health и readiness

Оба endpoint сейчас возвращают один ответ:

```json
{ "message": "OK" }
```

Используйте `/api/health` как проверку живого HTTP-процесса. `/api/ready` пока не подтверждает
доступность backend, Valkey или telemetry. Остановка Valkey сама по себе не делает replica
`unready`.

Если readiness начнёт проверять зависимости, заранее определите timeout и поведение при ошибке.
Ответ не должен раскрывать credentials или внутренние адреса.

`/api/cache-probe` не является health check. Route отвечает только при явном
`CACHE_PROBE_ENABLED=true`, `CI=true`, непроизводственном `APP_ENV` и совпадающем token; во всех
остальных случаях возвращает `404`. Его используют только изолированные dev/prod cache matrix
scripts, а в обычном deployment оставляют выключенным.

## Как проверить локально

E2E suite содержит проверки ответов health, readiness и metrics и сама поднимает и останавливает
standalone server:

```bash
npm run test:e2e:standalone
```

Для ручной проверки сначала выполните `npm run build`, затем оставьте `npm run prod` запущенным в
одном terminal. В другом terminal вызовите endpoints:

```bash
curl --fail http://localhost:3000/api/health
curl --fail http://localhost:3000/api/ready
curl --fail http://localhost:3000/api/metrics
```

Эта проверка не подтверждает конкретные cache metric series, scrape каждой реплики, Valkey server
metrics или доставку данных во внешний collector/Sentry. В целевом окружении выполните cache
операции, проверьте series на каждой реплике, отправьте контролируемое Sentry event и убедитесь, что
данные дошли без чувствительной информации.

## Связанные документы

- [Переменные окружения](environment.md)
- [Безопасность](security.md)
- [Self-hosting](self-hosting.md)
- [Развёртывание](deployment.md)
