# Готовность release и rollback

> Назначение: проверить готовность artifact, rollout и rollback.
>
> Статус: локальный standalone artifact проверяется; автоматический deploy отсутствует.

Репозиторий не содержит готовой команды публикации или deploy job. Шаги интеграции с registry,
Kubernetes, VM или другой платформой должны быть добавлены отдельно. Поэтому это checklist общих
требований, а не исполняемый runbook для конкретной платформы.

## 1. Подготовьте release candidate

1. Возьмите чистый checkout нужного commit и запишите его Git SHA.
2. Используйте Node.js 24, npm 11 и корневой `package-lock.json`.
3. Задайте production build-time values. Не копируйте реальный `.env` в artifact.
4. Запустите базовый gate и отдельные Docker-проверки общего кэша:

```bash
npm ci
npm run verify
npm run test:cache:integration
npm run verify:cache:compose
npm run test:cache:matrix:dev
npm run test:cache:matrix:prod
```

`npm run verify` выполняет быстрые проверки, Knip, JSCPD, оба Vitest projects, свежий production
build и Playwright против `.next/standalone/server.js`. Cache integration, Compose verifier и
matrix tests в неё не входят и требуют работающий Docker Engine.

Если gate не прошёл, release candidate не готов. `npm run build` можно использовать для быстрой
повторной сборки, но он не заменяет остальные проверки.

## 2. Зафиксируйте artifact

Сохраните рядом с immutable artifact:

- Git SHA и artifact digest;
- версии Node.js и npm;
- checksum `package-lock.json`;
- время сборки и публичные `NEXT_PUBLIC_*` values;
- `VALKEY_CACHE_NAMESPACE` и cache limits без `VALKEY_URL` credentials;
- build/deployment ID, если он настроен;
- имена и версии secret references, но не сами secrets.

Все реплики одного release должны запускать один и тот же artifact. Не собирайте приложение на
каждом instance отдельно и не используйте изменяемый tag `latest` как rollback point.

## 3. Подготовьте platform runbook

До rollout зафиксируйте конкретные команды или действия для:

- публикации и выбора artifact по digest;
- передачи server secrets и public build-time values;
- доступности Valkey, его credentials/TLS и namespace для release;
- переключения traffic и остановки rollout;
- проверки статуса каждой instance;
- возврата traffic на предыдущий artifact.

`NEXT_PUBLIC_*` уже встроены в browser bundle: для другого публичного URL нужен другой artifact
или отдельный runtime-config механизм.

Для нескольких реплик сначала выполните checklist из [self-hosting.md](self-hosting.md). Обычный
`'use cache'` использует общий Valkey handler, но deployment ID, другие server cache paths и
автоматический rolling rollout не настроены. Меняйте `VALKEY_CACHE_NAMESPACE` при несовместимом
формате данных или изоляции нового release; все реплики одного release должны использовать одно
значение.

## 4. Проверьте версию после rollout

```bash
curl --fail https://example.invalid/
curl --fail https://example.invalid/api/health
curl --fail https://example.invalid/api/ready
curl --fail https://example.invalid/api/metrics
```

Проверяйте metrics из разрешённой monitoring network — не открывайте endpoint ради smoke test.
Также проверьте:

- ключевой browser/API flow без `x-mock-mode: true`;
- загрузку JS, CSS и public assets;
- CSP и browser console;
- streaming через реальный ingress;
- контролируемое Sentry event;
- cache metrics и ожидаемое поведение shared cache между репликами;
- error rate и latency во время rollout.

Текущий `/api/ready` всегда возвращает `200`. Он не заменяет application smoke и проверку
зависимостей.

## Требования к rollback

Следующие шаги выполняются средствами целевой платформы. Если для них нет конкретных команд,
владельца и проверенного предыдущего artifact, rollback ещё не готов.

1. Остановите rollout. Запишите время, affected version и симптомы.
2. Верните traffic на предыдущий известный artifact, совместимые secret references и совместимый
   `VALKEY_CACHE_NAMESPACE`.
3. Не пересобирайте старый commit: получится другой build ID и, возможно, другие зависимости.
4. Повторите проверки страницы, endpoints, API flow, assets, CSP и error rate.
5. Для внешних schema/data migrations используйте отдельный backward-compatible rollback plan.
6. После стабилизации сохраните evidence и заведите regression test или operational action.

При mixed-version rollback возможны version skew и разные cache states. Автоматический rolling
rollback нельзя считать безопасным, пока не выполнены условия multi-instance deployment. Текущий
Compose Valkey работает без persistence: его пересоздание даёт общий холодный cache, а не
восстановление прежних entries.

## Что сохранить для расследования

- Git SHA, artifact digest и build/deployment ID;
- время rollout и список затронутых instances;
- обезличенные logs, traces и metrics за окно инцидента;
- response headers, CSP и browser console ключевого flow;
- имена и версии runtime config без secret values;
- результаты health/readiness и отдельной проверки зависимостей.

## Связанные документы

- [Запуск standalone](run-standalone.md)
- [Развёртывание](deployment.md)
- [Переменные окружения](environment.md)
- [Безопасность](security.md)
- [Наблюдаемость](observability.md)
