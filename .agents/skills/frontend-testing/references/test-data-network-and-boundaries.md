# Test data, network, and boundaries

## Boundary inventory

До mocks перечисли subject, его публичный observable contract и каждую
`external boundary`: HTTP/API, database/storage, browser API, clock, randomness,
analytics, email/payment и server/client transition. Сохраняй реальную
композицию внутри subject, пока она не делает тест недетерминированным или не
переносит проверку на другой контракт.

Выбирай замену на ближайшей внешней границе. Не мокай reducer, hook, дочерний
компонент и transport одновременно: такой тест доказывает только собственные
stubs.

## Network

- Запрещай случайную реальную сеть в unit/component tests.
- Используй существующий project network layer или test server; не вводи второй
  mocking stack без отдельного согласования.
- Включай fail on `unhandled request`, если установленный инструмент и setup это
  поддерживают.
- Моделируй success, ожидаемую business error, malformed response и критический
  transport failure только когда они входят в риск сценария.
- Не направляй тесты на production и не выполняй необратимые внешние side
  effects.

В E2E подменяй сеть только когда acceptance criterion не требует реальной
интеграции. Не перехватывай сам endpoint, поведение которого тест обязан
доказать. Проверяй URL/method/status/body лишь на той границе, где это публичный
контракт.

## Fixtures and builders

Создавай `typed` factories/builders с маленькими семантическими defaults.
Переопределяй только поля, значимые для сценария. Давай fixture имя по роли в
истории (`expiredSession`, `profileWithoutEmail`), а не по формату payload.

Не копируй огромный production response и не скрывай invalid state через broad
type cast. Для boundary values используй явные cases: пустое/минимум/максимум,
до/на/после лимита и важные state transitions.

## Server/client separation

Разделяй `server` и `client` environment. Не импортируй server-only modules,
secrets, filesystem или privileged SDK в jsdom/client test. Не эмулируй
browser-only APIs внутри server test, если контракт требует реального браузера.

Для Next.js сохраняй runtime boundary route module: чистую domain-функцию
проверяй unit-тестом, Request/Response — integration, hydration/navigation —
E2E. Подменяй environment через принятый config seam и восстанавливай его.

## Determinism

Контролируй `time`, timezone, `locale`, randomness, generated identifiers,
feature flags и `storage`, когда они влияют на результат. Фиксируй clock до
создания subject и всегда восстанавливай timers/globals. Не полагайся на
локальную машину, порядок запуска, текущую дату или ambient auth state.

Данные должны быть минимальными, валидными по умолчанию и безопасными для
report/trace. Не помещай реальные credentials, PII или access token в fixture.

## Parallel safety

Давай каждому test/`worker` уникальный namespace, user/account, resource ID и
browser context. Не дели mutable singleton, storage state или учётную запись
между тестами, меняющими данные. Worker-scoped resource допустим только при
доказанной read-only безопасности либо строгом разделении и teardown.

Проверь тест отдельно, в изменённом порядке и с project-default parallelism.
Не переводь весь suite в serial, чтобы скрыть race.

## Cleanup

Регистрируй `cleanup` сразу после успешного создания ресурса. Удаляй только
данные текущего namespace через безопасный project helper; не применяй broad
delete. Восстанавливай mocks, timers, environment, DOM, listeners, storage,
browser context и test server даже после failure.

Если cleanup невозможен, используй disposable environment с TTL и передай
остаточный риск. Не объявляй isolation доказанной без parallel run или иной
проверяемой project evidence.
