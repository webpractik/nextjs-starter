# Diagnosis, performance, and verification

## 1. Reproduce

Запиши точную command, cwd, runner/version, test selection, seed/repeat/workers,
environment и exit status. Сначала воспроизведи узкий failure без изменения
production code. Затем проверь, зависит ли он от порядка, parallelism, locale,
timezone, runtime или CI resources.

Не называй flaky то, что стабильно падает по одному observable contract. Не
исправляй diagnosis-задачу, пока пользователь не разрешил implementation.

## 2. Evidence

Собери минимальный набор, который локализует момент расхождения: assertion
output, `trace`, `screenshot`, `video`, browser/server `console`, `network` log,
timing и relevant Allure result. Сопоставь timestamps и test identity.

Не публикуй секреты, cookies, tokens или PII. Отсутствующий artifact пометь как
не собранный, а не как доказательство отсутствия проблемы.

## 3. Classify root cause

Классифицируй подтверждённый `root cause`, не симптом:

- shared state, грязные data/storage/session или недостаточный cleanup;
- ожидание не того async state либо arbitrary wait;
- unstable selector или скрытый accessibility contract;
- time/timezone/locale/randomness/order dependency;
- network/service instability или неправильная boundary substitution;
- CPU/memory/worker contention;
- version, config, environment или local/CI drift.

Запиши evidence за и против основной гипотезы. Если причин несколько, отдели
первичный trigger от факторов усиления.

## 4. Correct

Исправляй источник: изолируй state/data, жди наблюдаемый результат, выбери
семантический locator, зафиксируй environment или восстанови реальную boundary.
Добавь regression test, который сначала падает по ожидаемой причине.

`retries`, увеличенный `timeout`, serial mode и quarantine допустимы только как
временный control с owner, residual risk, сроком и follow-up. Они не являются
root-cause fix и не доказывают стабильность.

## 5. Measure suite performance

Не смешивай скорость test suite с runtime performance продукта. Перед
оптимизацией зафиксируй `baseline`: одинаковые test set, command, environment,
CPU/memory, workers, cache state, duration и bottleneck. После изменения повтори
те же условия несколько раз и покажи распределение, а не лучший единичный run.

Сначала сокращай redundant setup/mount/navigation/login, затем делай fixtures
ленивыми, устраняй shared state и только после измерений меняй workers/sharding.
Не ослабляй assertions, scenario coverage, isolation или artifacts ради времени.

## 6. Verify

Выполни и запиши:

1. focused regression/behavior test;
2. релевантный suite затронутого package;
3. существующие static/type/build gates, если применимы;
4. реальный browser run и artifacts для browser contract;
5. source compliance и emitted-result verification обязательных Allure labels.

Для каждой проверки укажи command, cwd, exit status и краткий result. Отделяй
новую regression от pre-existing failure. Не объявляй skipped/manual/pending
проверку прошедшей.

## 7. Handoff contracts

### Audit

Передай findings по severity с file/line evidence, наблюдаемым impact,
рекомендацией и открытыми вопросами. Не вноси writes без отдельного запроса.

### Plan

Передай mapping `criterion/risk -> scenario -> layer -> data/boundary -> file`,
порядок RED/GREEN/REFACTOR, реальные project commands и явно исключённый scope.

### Implementation

Передай изменённые behavior contracts, добавленные/обновлённые тесты, Allure
taxonomy, команды с результатами и residual risks. Не заявляй непроверенный
report, browser outcome или performance gain.

### Diagnosis

Передай reproduction, evidence, подтверждённый или наиболее вероятный root
cause, confidence, исключённые гипотезы и следующий минимальный experiment.
Fix описывай отдельно и реализуй только при наличии authority.
