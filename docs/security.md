# Безопасность

> Назначение: показать действующие меры защиты и известные пробелы.
>
> Статус: базовые headers и границы env реализованы; authentication в приложении отсутствует.

Этот документ не подтверждает compliance и не заменяет threat model конкретного продукта.

## Самое важное

- В приложении нет login, session middleware или Basic Auth.
- `/api/health`, `/api/ready` и `/api/metrics` не требуют authentication.
- `/api/cache-probe` — закрытый диагностический route и по умолчанию отвечает `404`.
- Production browser обращается к `NEXT_PUBLIC_BACK_URL` напрямую. Backend отвечает за CORS,
  CSRF и cookie attributes.
- `MOCK_MODE` и `NEXT_PUBLIC_MOCK_MODE` должны быть `false` в production.
- Значения `NEXT_PUBLIC_*` видны пользователю, даже если их имя похоже на secret.

## Что уже защищено

- Вне development приложение отправляет CSP, HSTS, `X-Content-Type-Options`, COOP/CORP,
  `Referrer-Policy`, `Permissions-Policy` и запрещает framing.
- Server env отделён от browser env. `src/env/server.ts` нельзя импортировать в Client Components.
- Cookie и page-based mock overrides отключены в production.
- Server Components используются по умолчанию, поэтому server-only код не должен попадать в
  browser bundle.
- Production Docker runner работает без root-прав.

## Authentication и authorization

`HTTP_AUTH_LOGIN` и `HTTP_AUTH_PASS` валидируются, но нигде не используются. Их наличие не включает
Basic Auth.

Считайте новый Route Handler или Server Action доступным из сети, пока не доказано обратное.
Проверяйте authentication, object-level authorization и входные данные внутри server boundary.
Скрытая кнопка не является проверкой доступа.

## Недоверенный HTML и XSS

Не передавайте HTML из API, CMS, URL или user input напрямую в `dangerouslySetInnerHTML`.
Используйте `SanitizedHtml` из `@repo/core/sanitized-html`: он применяет одну политику
санитизации до первого render и в Node.js, и в браузере. Не обходите его локальной
копией HTML insertion или отдельной, более слабой sanitizer policy.

Санитизация не делает контент доверенным: текст может оставаться ложным, ссылки —
phishing-ссылками, а разрешённые tags и attributes — нежелательными для конкретного домена.
При более строгом domain contract нужны отдельные allowlist и validation на границе ввода.
Там же ограничивайте размер HTML: синхронная санитизация чрезмерно большой строки может
блокировать server render или main thread браузера.

## CSP и security headers

Security headers отключены в development. Текущий CSP разрешает `'unsafe-inline'` и
`'unsafe-eval'`: это совместимый baseline, а не строгая nonce/hash policy.

`connect-src` разрешает только `'self'`, `data:`, `ws:` и `wss:`. Cross-origin backend или Sentry
ingest нужно добавить точным origin и проверить в browser. Не заменяйте allowlist на `*`.

HSTS работает только на HTTPS origin. Убедитесь, что reverse proxy не удаляет headers и корректно
завершает TLS. Проверяйте CSP и HSTS через реальный ingress, включая assets, telemetry, WebSocket и
страницы ошибок.

## API, cookies и proxy

Development BFF rewrite не работает в production. Browser использует `NEXT_PUBLIC_BACK_URL`, а API
client отправляет `credentials: 'include'`. Backend не может сочетать credentials с wildcard CORS
origin.

Server-side fetch не пересылает cookies входящего запроса автоматически. Если появится auth
adapter, передавайте только разрешённые headers. Внутренний `x-url` нужен для выбора mock route и
не является доверенным identity signal.

## Secrets и container build

- Не коммитьте `.env` и не копируйте его в image layers.
- `SENTRY_AUTH_TOKEN`, server DSN, credentials в `VALKEY_URL` и Server Actions encryption key
  остаются server-only.
- Source map token передавайте как CI или BuildKit secret.
- Проверяйте final image, metadata и history на отсутствие build secrets.
- Не логируйте credentials, cookies, authorization headers, DSN tokens или полный env.

Dockerfile передаёт `SENTRY_AUTH_TOKEN` builder через BuildKit secret. Текущий Compose contract
также добавляет его в runtime environment; это нужно исправить до production использования.

Встроенный Valkey не публикует port на host, но и не включает authentication или TLS. Считайте его
доверенным только внутри изолированной Compose network. Для внешнего Valkey используйте `rediss:`,
ограничение сети и отдельные credentials; не выводите полный `VALKEY_URL` в logs.

## Mock mode

Cookie и page allowlist не включают mocks в production. Однако явные flags `MOCK_MODE=true` и
`NEXT_PUBLIC_MOCK_MODE=true` могут это сделать.

Release configuration должна задавать оба значения `false`. В ключевом API smoke flow проверьте,
что ответа с `x-mock-mode: true` нет.

## Служебные endpoints

`/api/health`, `/api/ready` и `/api/metrics` не имеют application auth. Health endpoints не должны
раскрывать внутренние details. Metrics закройте на уровне ingress или сети и не используйте labels
с PII или высокой cardinality.

`/api/cache-probe` существует только для изолированной проверки shared cache. Доступ разрешён,
только когда одновременно выполнены все условия:

- `CACHE_PROBE_ENABLED=true`;
- `CI=true` и `APP_ENV` не равен `PROD`;
- передан header `x-cache-probe-token`, совпадающий с `CACHE_PROBE_TOKEN`;
- query-параметр `key` содержит 16–64 безопасных символа.

В остальных случаях route отвечает одинаковым `404`. Не включайте probe в production, не
публикуйте token и не используйте этот route как readiness endpoint или пользовательский API.

## Checklist для изменения security boundary

1. Опишите actor, asset и trust boundary.
2. Определите безопасное поведение при ошибке.
3. Добавьте validation и безопасный default.
4. Проверьте server/client import boundary и browser bundle.
5. Добавьте regression tests для auth, mock mode или CSP contract.
6. Выполните production build и browser smoke через реальный ingress.
7. Обновите environment reference и release runbook.

## Связанные документы

- [BFF proxy](bff-proxy.md)
- [Переменные окружения](environment.md)
- [Mock mode](mock-mode.md)
- [Наблюдаемость](observability.md)
- [Release и rollback](release-runbook.md)
