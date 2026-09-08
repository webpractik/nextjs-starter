# Critical review harness

## Когда читать

Читайте этот reference для каждого focused architecture review. Он определяет
review protocol, достаточное evidence, severity и report contract. Invariants
берите из применимых architecture, state/effects и decomposition references;
для generated HTTP API учитывайте также Kubb boundary из `SKILL.md`.

## Критическая позиция

Цель review — найти подтверждённые дефекты, а не подтвердить первоначальное
впечатление и не произвести максимальное число замечаний. Активно ищите
нарушения и обходные paths, затем пытайтесь опровергнуть каждый candidate.
Строгость без falsification создаёт false positives; осторожность без поиска
контрпримеров превращается в rubber stamp.

Не используйте `LGTM`, «архитектура корректна» или target-state compliance как
замену evidence. Отсутствие confirmed findings означает только, что в
обозначенном scope после перечисленных checks нарушение не доказано.

## 1. Scope contract

До оценки зафиксируйте:

- in-scope modules/files и entry points;
- проверяемые dependency paths, consumers и runtime branches;
- заявленные invariants или behavior;
- исключённые и недоступные области;
- project-native commands и architecture tooling, доступные без mutations.

Неизученная область не считается прошедшей review. Если запрос требует broad
repository scan, остановитесь и попросите explicit invocation
`improve-codebase-architecture`.

## 2. Coverage matrix

Проверьте каждую применимую ось по фактическому коду:

| Ось | Обязательное evidence |
| --- | --- |
| Ownership и dependencies | module graph, imports, entry points, cross-feature paths и реальные consumers |
| Public interface и depth | explicit exports, call sites, скрытые internals, deletion test и change radius |
| State, Effects и view | state owner, read/write flow, Effect contract/dependencies/cleanup и место business decision |
| Decomposition и Atomic Design | component declarations, physical lines, responsibilities, ownership и Story placement |
| CSR/SSR/RSC | server/client import path, request isolation, hydration contract и browser-only boundary |
| Generated API boundary | OpenAPI/Kubb entrypoints, generated read-only tree, adapters, public imports и server/client base URL composition |
| Enforcement и tests | active config, non-empty analyzed graph, relevant tests и negative boundary proof |

Для неприменимой оси запишите `not applicable` и конкретную причину. Для
непроверенной — `needs evidence` и недостающее evidence. Checklist или имя
folder не заменяют чтение consumers, call sites и import paths.

## 3. Adversarial candidate loop

Для каждой применимой оси:

1. Ищите нарушение и формулируйте candidate как falsifiable hypothesis.
2. Проследите path от public entry или producer до фактического consumer.
3. Ищите counterevidence: другой owner, защитный adapter, ограниченный scope,
   active validator, negative test или более строгую project convention.
4. Проверьте альтернативное объяснение и самый сильный контрпример.
5. Классифицируйте candidate:
   - `confirmed` — evidence достаточно, контрпример не снимает нарушение;
   - `rejected` — counterevidence опровергает нарушение;
   - `needs evidence` — доступного scope недостаточно для вывода.

В итоговые findings включайте только `confirmed`. Не публикуйте rejected
candidates. `needs evidence` перечисляйте среди limitations; не повышайте его
до finding и не маскируйте им green result.

## 4. Confirmation gate

Finding подтверждён, только если одновременно известны:

- точная file/location и нарушенный invariant;
- фактический dependency path, call site, execution/state flow или command
  evidence;
- затронутый consumer или runtime branch;
- конкретное consequence для correctness, security/data integrity, ownership,
  change amplification, testability или runtime behavior;
- проверенный counterevidence и причина, почему он не снимает finding;
- минимальное направление коррекции без несвязанного redesign.

Недостаточное evidence: гипотетический будущий reuse, вкусовое предпочтение,
одно имя file/folder, line count без responsibility analysis, regex candidate
scan без AST/manual confirmation, неактивный config, empty dependency graph и
тест, который не достигает заявленного boundary.

## 5. Обязательные критические вопросы

- Где фактически принимается business decision и должен ли этот код работать
  без React?
- Все ли consumers проходят через public surface, или существует bypass/deep
  import?
- Скрывает ли interface complexity и позволяет ли тестировать behavior без
  знания internals?
- Не владеют ли одним state два механизма или два lifecycle?
- Действительно ли Effect синхронизируется с названной external system?
- Может ли server-only/request-specific state попасть в shared client/process
  graph?
- Не редактируется ли generated tree и не дублируются ли generated
  transport/types/schemas/hooks вручную?
- Доказывает ли tooling правило на non-empty graph и expected-negative case?
- Какой самый сильный контрпример способен снять candidate finding?

## Severity

| Severity | Порог |
| --- | --- |
| `blocker` | Доказанный риск неправильного runtime behavior, build/hydration, security/data integrity либо невозможность безопасно выполнить заявленное изменение. |
| `high` | Подтверждённое нарушение ownership/boundary/state уже затрагивает несколько consumers или существенно увеличивает change radius и риск correctness regression. |
| `medium` | Локальный структурный дефект наносит конкретный ущерб testability, replaceability или сопровождению. |
| `low` | Ограниченный, но доказанный архитектурный долг с конкретным consequence. |

Определяйте severity по consequence. Размер file, название pattern и сила
формулировки сами по себе severity не повышают. Style preference и
необязательный redesign не являются findings. Сортируйте findings по severity
и не размывайте high-leverage проблему списком слабых замечаний.

## Report contract

Начинайте report с confirmed findings по убыванию severity:

```markdown
## Findings

### [high] Короткий проверяемый verdict

- Location: `path/to/file.ts:42`
- Invariant: нарушенное правило
- Evidence/trace: producer → boundary → consumer или command/result
- Consequence: конкретный текущий ущерб или риск
- Counterevidence checked: что проверено и почему finding сохранился
- Minimal correction: узкое направление исправления

## Coverage

| Axis | Status | Evidence or limitation |
| --- | --- | --- |
| Ownership and dependencies | checked | paths/commands |
| CSR/SSR/RSC | needs evidence | недоступная runtime branch |

## Summary

Количество confirmed findings, границы вывода и residual risk.
```

Если findings нет, напишите: «Confirmed findings в указанном scope не
найдены». Затем всё равно покажите coverage, checked paths/commands,
`needs evidence` и residual risk. Не заявляйте полное architecture compliance.

## Fresh-context escalation

Используйте `doubt-driven-development`, если scope затрагивает
security/authorization, pricing, data integrity, server-client isolation или
широкую cross-feature boundary; finding оспаривается; evidence противоречиво;
либо вывод определяет дорогой cross-module refactor. Передайте reviewer только
artifact, contract и scope. Его ответ является candidate data и проходит тот
же counterevidence и confirmation gate; не rubber-stamp второй review.

## Stop condition

Review завершён, когда все применимые coverage axes имеют `checked`,
`not applicable` с причиной или `needs evidence` с точным limitation; каждый
опубликованный finding прошёл confirmation gate; high-risk escalation завершён
при наличии его условия; report следует contract. Количество findings не
является stop condition или метрикой качества.
