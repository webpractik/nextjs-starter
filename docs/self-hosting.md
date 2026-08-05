# Self-hosting и несколько реплик

> Назначение: объяснить ограничения нескольких Next.js процессов.
>
> Статус: standalone работает; Compose описывает две реплики и один Valkey на одном host.
> Handler integration и dev/prod app matrices прошли локально; rolling и multi-host не готовы.

Две реплики за gateway не означают high availability: host и gateway остаются общими точками
отказа, а Valkey — ещё одной. Через Valkey согласован только default scope Cache Components;
другие cache scopes и release state требуют отдельного контракта.

## Текущая граница поддержки

| Область                   | Сейчас                              | Оставшаяся граница                             |
| ------------------------- | ----------------------------------- | ---------------------------------------------- |
| Artifact                  | Standalone build                    | Один immutable artifact для всех реплик        |
| Build ID                  | Случайный при каждой сборке         | Один ID для всех реплик artifact               |
| Deployment ID             | Не задан                            | Один ID на release для version-skew protection |
| Server Actions key        | Создаётся при build                 | Общий ключ для одновременных builds            |
| `'use cache'`             | `cacheHandlers.default` на Valkey   | Общий только при одном URL и namespace         |
| ISR и Route Handler cache | Singular `cacheHandler` не задан    | Valkey handler не даёт cross-replica guarantee |
| Valkey                    | Один ephemeral container            | Нет persistence, replication и failover        |
| Prometheus                | Registry отдельно в каждом процессе | Scrape всех реплик и агрегация                 |
| Readiness                 | Не проверяет Valkey                 | Явные dependency checks, если они нужны        |

Sticky sessions не решают version skew, cache invalidation или потерю состояния после restart.

## Один artifact на release

`generateBuildId` создаёт случайный ID при каждой сборке. Если один готовый image или
`.next/standalone` запускается несколько раз, все реплики получают один build ID. Если каждая
реплика собирается отдельно, IDs, assets и Server Function references могут разойтись.

`deploymentId` и `NEXT_DEPLOYMENT_ID` не настроены. Для rolling deployment задайте один ID всем
репликам release; новый release получает новый ID. Это помогает клиенту обнаруживать version skew,
но не заменяет immutable artifact.

Next.js создаёт Server Actions encryption key во время build. Один artifact уже содержит один
ключ. Если во время rollout одновременно работают разные builds с Server Actions, задайте им общий
`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` через защищённый build environment.

## Cache scopes и контракты

Singular `cacheHandler` обслуживает ISR, Route Handler responses и другие paths incremental
server cache. Он не задан. Plural `cacheHandlers` выбирает backend по директиве Cache
Components. Сейчас в `next.config.ts` задан только `cacheHandlers.default`:

| Scope                   | Backend и граница                                     |
| ----------------------- | ----------------------------------------------------- |
| `'use cache'`           | Valkey; shared между replicas на одном URL/namespace  |
| `'use cache: remote'`   | `remote` не задан; остаётся in-memory handler Next.js |
| `'use cache: private'`  | Не использует handler и не хранит server entry        |
| `'use cache: <name>'`   | Named handlers не настроены                           |
| Singular `cacheHandler` | Valkey не подключён; cross-replica guarantee нет      |

## Что хранит Valkey handler

| Параметр                       | Семантика                                                     |
| ------------------------------ | ------------------------------------------------------------- |
| `VALKEY_URL`                   | Endpoint; реплики должны использовать один backend            |
| `VALKEY_CACHE_NAMESPACE`       | Изолирует entries и tag markers; для sharing должен совпадать |
| `VALKEY_CACHE_MAX_ENTRY_BYTES` | Лимит всего binary envelope; default 1 MiB                    |
| `VALKEY_CACHE_MAX_TTL_SECONDS` | Верхняя граница TTL entry key; default 86 400 секунд          |

Каждая entry хранится по `namespace:entry:<sha256(cacheKey)>` одним binary value: raw
stream вместе с tags, `timestamp`, `stale`, `revalidate` и `expire`. Физический TTL ключа
равен `expire`, округлённому вверх, но не меньше одной секунды и не больше
`VALKEY_CACHE_MAX_TTL_SECONDS`. Исходный `expire` в metadata не меняется и проверяется
при чтении. Поэтому cap может вызвать ранний miss, но не продлевает logical lifetime.

Тег хранится отдельным marker по `namespace:tag:<sha256(tag)>`. `updateTags()` записывает все
markers одной Valkey transaction с TTL `max TTL + 300` секунд. При чтении handler объединяет
явные tags entry и soft tags запроса, затем читает markers через `MGET`. Immediate
invalidation превращает более старую entry в miss; profiled invalidation сначала возвращает её с
`revalidate: -1`, а после `expire` — miss. Entries при этом не перебираются и не удаляются.

`refreshTags()` ничего не делает, а `getExpiration()` возвращает `Infinity`: локального tag
manifest нет, soft tags проверяются по shared markers в самом `get()`. Во время production build
handler возвращает misses и пропускает writes и invalidations, не подключаясь к Valkey.

## Отказы и конкурентность

- Backend- или decode-ошибка чтения даёт miss. При повреждении entry или tag marker handler
  best effort удаляет entry. Повреждённый marker остаётся до истечения TTL и может повторять miss.
- Backend-ошибка записи, ошибка source stream или oversize entry не ломают response:
  результат остаётся незакешированным.
- Ошибка invalidation transaction не подавляется. `updateTag` и `revalidateTag` могут завершить
  mutation flow ошибкой, если markers не удалось записать.
- Client использует `500 ms` connect timeout, `750 ms` command timeout, отключённую offline queue
  и один retry на request. Connection errors логируются не чаще раза в 30 секунд.
- `pendingSets` существует только в памяти handler одного процесса: `get()` дожидается
  уже начатого `set()` того же key. Distributed lock или cross-replica single-flight нет, поэтому
  одновременные misses могут создать stampede на source.

## Потеря Valkey

Compose запускает один Valkey с `--save ''`, `--appendonly no`, без persistent volume. Default
`maxmemory` — 128 MiB, policy — `volatile-ttl`; container limit — 192 MiB. Перезапуск, eviction или
потеря сервиса полностью очищают кеш; eviction удаляет отдельные keys. Если tag marker
исчезнет раньше старой entry, будет потеряна и invalidation history. Это хранилище не является
источником данных, но после потери возможен всплеск нагрузки на source. Текущая схема не даёт
Valkey high availability или durable cache.

## Что проверено

`npm run test:cache:integration` запускает real Valkey и два независимых clients. Четыре теста
подтверждают shared entry, immediate/profiled/soft-tag invalidation, удаление повреждённой entry
без удаления несвязанного key и восстановление после outage. Это handler-level проверка, а не
smoke test двух запущенных Next.js replicas через gateway.

`npm run test:cache:matrix:dev` и `npm run test:cache:matrix:prod` проверяют две реальные Next.js
replicas: shared hit, cross-replica invalidation, пересоздания реплики и Valkey, read/invalidation
при outage и cache metrics обоих процессов. Оба режима успешно прошли 2 августа 2026 года на
изолированных Compose projects; scripts собирают свежий image и гарантируют cleanup.

## Метрики, readiness и streaming

Каждая реплика отдаёт собственный `/api/metrics`, включая cache operation latency/outcomes и
invalidation outcomes. Scraper должен обращаться ко всем репликам, а endpoint должен быть закрыт
от публичной сети.

`/api/health` и `/api/ready` сейчас одинаковы и не проверяют backend или cache. Используйте их как
liveness, пока не определён настоящий readiness contract.

Приложение отправляет `X-Accel-Buffering: no` вне development. Проверьте streaming через весь путь:
gateway, ingress, load balancer и CDN. При shutdown сначала снимите реплику с traffic, затем дайте
завершиться текущим requests и `after()` callbacks.

## Когда multi-instance deployment готов

1. Все реплики запускают один immutable artifact с известным provenance.
2. Заданы deployment ID и, при необходимости, общий Server Actions key.
3. Для singular, default, remote, private и named cache scopes выбран shared или явно
   допустимый per-instance contract.
4. Shared hit и tag invalidation проверены через две реальные Next.js replicas и gateway.
5. Для Valkey приняты явные persistence, failover, capacity и outage contracts.
6. Metrics собираются со всех реплик и недоступны публично.
7. Определены readiness, shutdown, rolling и rollback procedures.
8. Mixed-version rollout проверен для navigation, assets, Server Functions и cache.

## Официальная документация Next.js

- [Self-hosting](https://nextjs.org/docs/app/guides/self-hosting)
- [`output: 'standalone'`](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [`deploymentId`](https://nextjs.org/docs/app/api-reference/config/next-config-js/deploymentId)
- [`cacheHandler`](https://nextjs.org/docs/app/api-reference/config/next-config-js/incrementalCacheHandlerPath)
- [`cacheHandlers`](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheHandlers)

## Связанные документы

- [Cache Components и streaming](cache-and-streaming.md)
- [Развёртывание](deployment.md)
- [Наблюдаемость](observability.md)
- [Release и rollback](release-runbook.md)
