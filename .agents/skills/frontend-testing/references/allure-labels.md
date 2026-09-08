# Mandatory Allure labels

## Contents

- [Contract](#contract)
- [Required taxonomy](#required-taxonomy)
- [Parameterized tests](#parameterized-tests)
- [Non-substitutes](#non-substitutes)
- [Adapter gate](#adapter-gate)
- [Verification](#verification)
- [Exceptions](#exceptions)

## Contract

Каждый runnable `test`/`it` callback обязан сам вызвать и `await allure.labels`
из npm-пакета `allure-js-commons` до subject-specific setup. Применяй правило к
unit, component, integration и E2E, включая `.only`, `.concurrent`, `test.each`
и `it.each`. Наличие labels в hook, suite metadata или соседнем тесте не
покрывает callback.

Импортируй Runtime API так, как поддерживает установленный adapter; базовая
каноническая форма:

```ts
import * as allure from "allure-js-commons";

it("submits valid profile data", async () => {
  await allure.labels(
    { name: "layer", value: "component" },
    { name: "feature", value: "profile" },
    { name: "story", value: "update profile" },
    { name: "severity", value: "critical" },
  );

  // arrange, act, assert
});
```

## Required taxonomy

Добавляй ровно четыре обязательных label category в каждый callback:

- `layer`: `unit`, `component`, `integration` или `e2e` по реально выбранной
  границе;
- `feature`: подтверждённая продуктовая capability, не имя файла/компонента;
- `story`: конкретный наблюдаемый сценарий или acceptance criterion;
- `severity`: `trivial`, `minor`, `normal`, `critical` или `blocker` по
  оценённому риску и принятой project taxonomy.

Не выдумывай `feature`, `story`, owner или business hierarchy. Извлекай значения
из требований, существующего Allure report и соседних тестов; при конфликте
остановись и зафиксируй вопрос. Добавляй `epic`, `owner`, tags, external IDs и
другие labels только при подтверждённых значениях.

## Parameterized tests

Вызывай labels внутри callback каждой параметризованной строки, чтобы значения
попали в конкретный emitted result:

```ts
test.each(cases)("rejects invalid profile: $name", async ({ input, story }) => {
  await allure.labels(
    { name: "layer", value: "component" },
    { name: "feature", value: "profile" },
    { name: "story", value: story },
    { name: "severity", value: "normal" },
  );

  // arrange, act, assert
});
```

Данные label должны быть детерминированными, несекретными и строковыми. Не
переноси вызов наружу в factory, если source review перестаёт доказывать наличие
четырёх labels в каждом runnable callback.

## Non-substitutes

Следующее может дополнять, но не заменяет обязательный per-test Runtime API:

- `beforeEach`/`beforeAll`: hook может упасть до входа в callback;
- `describe` metadata, title tags и wrapper abstraction;
- reporter `globalLabels`: они не доказывают сценарную taxonomy теста;
- Metadata API в имени или annotations;
- общий helper без явного `await allure.labels` в callback.

## Adapter gate

Проверь manifest, lockfile, runner config, setup, CI command и реальный output
для `allure-vitest`, `allure-jest` или `allure-playwright`. Сверь API с
установленными версиями и обязательным runner specialist skill.

`allure-js-commons` предоставляет Runtime API, но сам по себе не является
reporter. Если adapter/config отсутствует, не заявляй emitted-result support.
При явно разрешённой implementation-задаче предложи минимальное изменение через
package manager проекта; без разрешения останови запись тестов и передай
blocker. Не устанавливай dependency автоматически.

## Verification

Разделяй два независимых gate:

1. **source compliance** — каждый runnable callback явно импортирует API,
   вызывает и ожидает четыре обязательных labels до setup тестируемого subject;
2. **emitted-result verification** — focused run создал result для выбранного
   теста, а configured Allure output содержит `layer`, `feature`, `story` и
   `severity` с ожидаемыми значениями.

Запиши command, cwd, exit status и путь к безопасному evidence. Не публикуй
tokens, cookies, PII или секретные request data. Если `beforeEach` упал до
callback, emitted labels не доказаны даже при source compliance.

## Exceptions

`test.todo` без callback и действительно неисполняемый `test.skip` являются
явными audit exceptions: перечисли файл, причину, residual risk и follow-up.
Quarantine, retry или skip не превращают отсутствующие labels в pass. Как только
callback снова runnable, полный per-test contract обязателен.
