# React 18/19 testing

## Boundary

Используй этот reference для компонентов, hooks, providers, Suspense и React
browser boundaries. Сначала подтверди React 18 или React 19, установленный
renderer, runner и существующие helpers. Не переноси API между версиями по
памяти и не добавляй новую test infrastructure без разрешения.

## Version discovery

Проверь manifest и lockfile затронутого package, imports в соседних тестах,
test config, setup-файлы и CI command. Считай фактическую комбинацию `react`,
`react-dom`, `@testing-library/react` и `@testing-library/user-event` единым
контрактом совместимости.

- В React 18 сохраняй совместимый с проектом import и helper для `act`.
- В React 19 импортируй `act` из `react`, только если действительно нужен
  прямой async act; пользовательские действия и ожидания предпочитай выражать
  через renderer и Testing Library.
- Не добавляй новые тесты на `react-test-renderer` или shallow renderer:
  `react-test-renderer` deprecated для React 19 и привязывает проверки к
  реализации.
- Для Vitest-specific API сначала полностью прочитай установленный skill
  `vitest`; для Jest следуй подтверждённой версии и локальной конфигурации.

## Decision table

| Контракт | Минимальный уровень | Наблюдаемая граница |
| --- | --- | --- |
| Pure mapper, reducer, validator | unit | return value или state transition |
| Component rendering и interaction | component/integration | DOM и accessibility tree |
| Public hook | component consumer; `renderHook` только если уже принят | публичный return contract и rerender |
| Provider composition | integration | поведение реального consumer |
| Suspense | component/integration | fallback, затем результат или ошибка |
| Error boundary | component/integration | fallback UI и recovery contract |
| hydration, browser API, focus/history | browser E2E | результат в реальном браузере |

## Interaction and async rules

Предпочитай `@testing-library/react` и `user-event`. Ищи элементы по role,
accessible name, label и видимому тексту; test id используй только при
отсутствии семантической границы. Выполняй действия через поддерживаемый
проектом `user-event` setup и жди конечное состояние через `findBy*`, `waitFor`
или web-first browser assertion.

Не вызывай handlers напрямую и не оборачивай всё механически в `act`. Прямой
async act применяй только для внешнего обновления, которое renderer не умеет
выразить сам, и обязательно дожидайся результата. Не используй arbitrary sleep,
ручной flush очередей или assertion только на число внутренних вызовов.

## Hooks and providers

Проверяй hook через минимальный consumer, когда пользовательский DOM-контракт
важнее формы возвращаемого API. Если публичным контрактом является сам hook и
проект уже использует `renderHook`, проверяй начальное значение, изменение
inputs, cleanup и ошибку без чтения private state.

Собирай wrapper только из реально нужных providers. Используй production
provider с узкой fixture-конфигурацией; не мокай context, reducer и дочернее
дерево одновременно. Восстанавливай timers, globals, storage и mocks после
каждого теста.

## Error and hydration boundaries

Для Suspense докажи переход `fallback -> result` или `fallback -> error`, а не
внутреннее количество renders. Для error boundary проверь видимый fallback,
доступное сообщение и предусмотренный recovery; подавляй ожидаемый console
output только узко и с восстановлением spy.

Проверяй hydration mismatch, server/client markup, browser-only API и реальные
navigation effects через E2E. Component test, который только вызывает
`hydrateRoot` в неполном DOM emulator, не доказывает браузерный контракт.

## Reject

- Assertions на implementation state, JSX tree, CSS-класс или private method.
- Прямые вызовы event handlers вместо пользовательского interaction.
- Broad child mocks, скрывающие композицию и provider lifecycle.
- Новые snapshot-only, shallow-renderer или `react-test-renderer` проверки.
- Необоснованные sleeps, глобальные fake timers и version-specific API без
  подтверждённой установленной версии.
