# Рабочие процессы и verification

## Когда читать

Читайте этот reference перед началом architecture work и перед handoff. Он
задаёт режим, REQUIRED SUB-SKILL routing, проверки и Definition of Done.

## Содержание

- [Выбор режима](#выбор-режима)
- [Маршрутизация REQUIRED SUB-SKILL](#маршрутизация-required-sub-skill)
- [Правила разрешения конфликтов](#правила-разрешения-конфликтов)
- [Процесс для новой feature](#процесс-для-новой-feature)
- [Процесс structural design](#процесс-structural-design)
- [Процесс рефакторинга](#процесс-рефакторинга)
- [Процесс focused review](#процесс-focused-review)
- [Проверки по layers](#проверки-по-layers)
- [Обработка проблем](#обработка-проблем)
- [Handoff](#handoff)
- [Ограничение этой версии skill](#ограничение-этой-версии-skill)
- [Definition of Done для implementation и refactor](#definition-of-done-для-implementation-и-refactor)
- [Definition of Done для review и design](#definition-of-done-для-review-и-design)

## Выбор режима

- New feature: пользователь просит создать или расширить behavior.
- Structural design: определить interfaces/ownership/seams без edits до
  отдельного запроса implementation.
- Refactor: behavior сохраняется, structure меняется.
- Focused review: известные modules/invariants, read-only.
- Broad architecture scan: попросить пользователя явно запустить
  improve-codebase-architecture.

## Маршрутизация REQUIRED SUB-SKILL

| Skill | Условие запуска |
| --- | --- |
| codebase-design | любое architecture design/refactor/review |
| vercel-react-best-practices | любое создание/изменение/review React code |
| typescript-magician | TypeScript contracts, any/unknown, type errors, tsc |
| incremental-implementation | multi-file implementation/refactor или change перестал быть минимальным |
| code-simplification | green code после implementation/refactor |
| doubt-driven-development | high-risk scope, спорный/противоречивый finding или дорогое cross-module решение |
| improve-codebase-architecture | broad scan, только explicit user invocation |
| tanstack-query | query keys, cache, mutations, pagination или Query hydration |
| openapi | создание/изменение HTTP API operation или wire contract |

Перед применением читайте актуальный SKILL.md каждого подходящего skill. Не
заменяйте invocation пересказом из этого reference.

Sub-skills не расширяют разрешённый scope. В review/design используйте их
mutation-oriented steps только для диагностики: не изменяйте files, не
создавайте tests и не выполняйте commits. Commit и push допустимы только по
явному запросу пользователя; без него commit-step
`incremental-implementation` является checkpoint без Git mutation.

После основного SKILL.md vercel-react-best-practices загружайте только те
rule-файлы, которые непосредственно относятся к текущей React-задаче.

- incremental-implementation обязателен также тогда, когда работа перестала
  быть одним минимальным change, даже если files пока немного.
- code-simplification может завершить clarity pass без edits; не создавайте
  churn и не упрощайте unrelated code.
- При изменении domain terms или invariants сверяйте их с существующим кодом и
  документацией; неразрешённые расхождения фиксируйте и уточняйте у пользователя.
- improve-codebase-architecture содержит disable-model-invocation: true:
  объясните ограничение и запросите explicit invocation у пользователя.
- tanstack-query владеет детальными data-fetching decisions; текущий
  skill сохраняет только architecture и state ownership.
- doubt-driven-development получает artifact/contract/scope без исходного
  verdict; его ответ остаётся candidate data и проходит confirmation gate из
  critical review harness.

## Правила разрешения конфликтов

- Dependency boundary = enforced import rule; seam = replaceable behavior.
- Narrow public entry/subpath допускается; giant barrel запрещён.
- TanStack Query имеет приоритет над SWR-specific advice.
- Advanced types оправдываются type safety и затем проходят simplification.
- Требования пользователя и более строгие project conventions имеют приоритет.

## Процесс для новой feature

1. Изучить repository, conventions, commands, module graph и runtime. Для HTTP
   API в scope дополнительно изучить OpenAPI/Kubb entrypoints и server/client
   env declarations; в evidence фиксировать только роли без имён и значений.
2. Загрузить обязательные sub-skills.
3. При фактическом изменении terms/invariants сверить domain language с
   существующим кодом и документацией; неразрешённые расхождения уточнить до
   реализации.
4. Для HTTP API в scope проверить source contract через
   openapi, определить Kubb generated boundary и раздельные
   server/client composition modules; менять contract только при подтверждённом
   wire change/mismatch.
5. Определить public interface, state owners, seams и adapters.
6. Для multi-file или уже неминимального change реализовать один vertical slice
   через incremental-implementation. Минимальный single-file change выполнить
   напрямую.
7. Для HTTP API в scope запустить Kubb generation, generated typecheck и
   повторную generation без diff; доказать server/client env isolation и
   synthetic runtime tests каждого base URL/role-only fail-fast именно в этом
   порядке.
8. Для TypeScript change запустить совместимый `tsc --noEmit` до и после; затем
   относящиеся к slice format/lint/typecheck/tests/build.
9. Проверить Vercel rules, architecture, Effects, decomposition и Atomic Design.
10. Применить code-simplification к changed code после green checks.

## Процесс structural design

1. Изучить фактический module graph, conventions, runtime и ограничения scope.
2. Определить public interface, state owners, seams и dependency direction.
3. Зафиксировать assumptions, открытые решения и verification strategy.
4. Применить sub-skills diagnostic-only и не изменять files, tests,
   dependencies или Git state.
5. Передать design contract; implementation начинать только по отдельному
   запросу.

## Процесс рефакторинга

1. Зафиксировать behavior с помощью characterization tests и, для TypeScript
   change, сохранить baseline совместимого `tsc --noEmit`.
2. Составить карту modules/interfaces/seams и выбрать одну reason to change.
3. Для multi-file или уже неминимального change переносить по одной
   responsibility через incremental-implementation; минимальный single-file
   refactor выполнить напрямую.
4. Оставлять каждый increment buildable и behavior-preserving.
5. Проверять TypeScript contracts и React rules.
6. Для HTTP API в scope запустить Kubb generation, generated typecheck и
   повторную generation без diff; доказать server/client env isolation и
   synthetic runtime tests каждого base URL/role-only fail-fast.
7. Для TypeScript change повторить совместимый `tsc --noEmit`, затем упрощать
   только changed code после green checks.
8. Не объединять behavior change, redesign и unrelated cleanup.

Big-bang rewrite не является допустимым default.

## Процесс focused review

Оставайтесь в read-only режиме, если fixes явно не запрошены. Используйте
codebase-design; для React code применяйте vercel-react-best-practices, а
typescript-magician — только при фактических TypeScript contracts, any/unknown,
type errors или compiler checks. Все sub-skills работают diagnostic-only.
Для in-scope HTTP API проверяйте существующие OpenAPI/Kubb config, generated
tree и runtime composition. Не запускайте Kubb generation в repository или
другие write-capable commands; непроверенные generation/drift gates отмечайте
как `needs evidence`.

1. Прочитайте `critical-review-harness.md` и зафиксируйте scope contract.
2. Постройте фактические dependency paths, consumers и применимую coverage
   matrix; checklist не заменяет чтение кода и active tooling.
3. Для каждой оси выполните adversarial candidate loop и попытайтесь
   опровергнуть каждый candidate сильнейшим доступным counterevidence.
4. Публикуйте только confirmed findings, прошедшие confirmation gate;
   `needs evidence` переносите в limitations.
5. При high-risk/спорном условии запустите doubt-driven-development и повторно
   проверьте его candidates, не принимая ответ автоматически.
6. Начните handoff с findings по severity, затем покажите coverage, limitations
   и summary. При отсутствии findings используйте no-findings contract, не
   заявляя architecture compliance.

## Проверки по layers

| Layer | Проверяемое поведение |
| --- | --- |
| domain | pure unit tests |
| application | use-case tests через ports/fakes |
| infrastructure | contract/integration tests |
| ui | observable behavior, accessibility и interaction tests |
| atoms/molecules | Stories и focused component tests |
| organisms | component/integration tests, без Stories |
| templates | structural/layout tests, без Stories |
| pages | integration/E2E tests, без Stories |
| SSR/RSC | hydration и server/client import checks |
| API codegen | Kubb 5 TypeScript/Zod 4/native Fetch/React Query outputs, generated typecheck, повторный run без drift |
| architecture | public imports, cycles и negative dependency test |

## Обработка проблем

- Сохраняйте evidence по pre-existing failures и доказывайте, что они не
  связаны с текущим изменением. Out-of-scope failures не блокируют scoped
  implementation/refactor или review; сообщайте их отдельно как baseline, не
  смешивая с in-scope findings.
- Если architecture tooling отсутствует, предложите минимальный вариант и
  запросите согласие до добавления dependency.
- Если behavior неясно, добавьте characterization test до перемещения кода.
- Если Effect кажется необходимым, назовите external system, synchronization
  contract и требуется ли cleanup для созданной operation/resource.
- Если обязательный sub-skill отсутствует, сообщите его имя; не утверждайте,
  что он был запущен.
- Если module graph неясен, сначала опишите фактические dependencies и не
  навязывайте template вслепую.
- Если владелец business rule неясен, проверьте, должна ли логика работать без
  React, и назовите module, принимающий решение.
- Более строгие project conventions сохраняйте; изменение architecture
  standard оформляйте как отдельное решение.

## Handoff

После implementation сообщите об изменённых modules/public interfaces,
dependency direction, решениях по decomposition и Effects, commands/results,
оставшихся ограничениях и pre-existing failures.

После review начните с confirmed findings по severity и для каждого покажите
location, invariant, evidence/trace, consequence, проверенный counterevidence и
minimal correction. Затем передайте coverage matrix, `needs evidence`,
pre-existing/out-of-scope failures и summary. При отсутствии findings назовите
проверенные files, dependency paths, state/effect/runtime checks и commands и
не заявляйте полное architecture compliance.

После structural design передайте public interface, state owners, seams,
dependency direction, assumptions и verification strategy.

## Ограничение этой версии skill

Не создавайте agentic evals, benchmark или eval fixtures. Tests в этой
инструкции означают проверки целевого проекта. Static validation самого skill
не доказывает качество его behavior.

## Definition of Done для implementation и refactor

Применяйте target-state gates только к changed/in-scope files, modules и
dependency paths. Глобальная проверка всего repository требуется только при
явно согласованном broad scope. Out-of-scope pre-existing failures фиксируются
с evidence, но не блокируют завершение.

- [ ] Инструкции применимых REQUIRED SUB-SKILL загружены и выполнены.
- [ ] Ни один in-scope production component file не превышает 800 lines.
- [ ] Для in-scope production component files длиннее 200 lines выполнен
  decomposition review.
- [ ] В каждом production file объявлен один React component.
- [ ] Размещение по Atomic Design сохраняет feature ownership.
- [ ] Stories существуют только для atoms/molecules.
- [ ] Deep imports и cycles отсутствуют.
- [ ] Domain/application не зависят от React или concrete infrastructure.
- [ ] View не содержит business decisions.
- [ ] Effects прошли decision ladder и имеют cleanup там, где setup создаёт
  отменяемую operation или освобождаемую resource.
- [ ] Server state не дублируется за пределами TanStack Query.

Для in-scope HTTP API дополнительно обязательны следующие gates:

- [ ] Source OpenAPI contract является единственным Kubb input;
  включены TypeScript, Zod 4, native Fetch с validation и React Query hooks.
- [ ] Generated tree read-only и доступен UI только через handwritten feature
  public boundary; domain/application не зависят от concrete transport.
- [ ] Kubb generation, generated typecheck и повторный run без diff прошли.
- [ ] Server/client composition используют разные обнаруженные env variables
  без fallback и client reachability server-only module.
- [ ] Server request-scoped и stable browser generated clients передаются в
  query artifacts через typed Kubb config; synthetic tests доказывают оба base
  URL paths и role-only fail-fast без live API/env names/values.

Для всех implementation/refactor задач применяются завершающие gates:

- [ ] External store подключён через useSyncExternalStore.
- [ ] Существующие format, lint, typecheck, tests и build выполнены без новых
  failures.
- [ ] Pre-existing failures отделены от ошибок изменения evidence.

## Definition of Done для review и design

- [ ] Scope review/design и проверенные dependency paths названы явно.
- [ ] Применимые REQUIRED SUB-SKILL загружены в diagnostic-only режиме.
- [ ] Files, tests, dependencies и Git state не изменялись, если fixes или
  implementation отдельно не запрошены.
- [ ] Все применимые coverage axes имеют `checked`, `not applicable` с причиной
  или `needs evidence` с точным limitation.
- [ ] Каждый опубликованный finding имеет severity, location, invariant,
  evidence/trace, consequence, проверенный counterevidence и minimal correction.
- [ ] Rejected candidates не опубликованы; `needs evidence` не выдан за finding
  или green result.
- [ ] High-risk/спорные выводы прошли doubt-driven-development и повторный
  confirmation gate, когда выполнялось условие escalation.
- [ ] No-findings report перечисляет выполненные checks и ограничения и не
  заявляет полное architecture compliance.
- [ ] Pre-existing и out-of-scope failures отделены от in-scope findings.
- [ ] Design фиксирует public interface, state owners, seams и assumptions;
  findings не блокируют review, а итог не заявляет target-state compliance.
- [ ] Для in-scope HTTP API review/design названы OpenAPI/Kubb ownership,
  generated boundary, server/client env isolation и непроверенные drift gates.
