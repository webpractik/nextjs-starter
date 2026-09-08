---
name: modular-react
description: Использовать, когда нужно спроектировать новую feature, рефакторить или провести архитектурное ревью React + TypeScript-кода, включая Kubb-generated HTTP API boundary, декомпозировать крупные компоненты, вынести business logic из view, устранить лишние useEffect, настроить dependency boundaries, исправить deep imports или cycles либо применить Atomic Design.
---

# Чистая модульная архитектура React + TypeScript

## Основной принцип

Стройте feature-first modules с узкими interfaces и направленными dependencies.
Atomic Design классифицирует UI, но не меняет ownership. View отображает
view-ready data; domain/application владеют business decisions.

## Совместимость

Требует React и TypeScript; использует TanStack Query, Kubb, Zod, react-use,
useSyncExternalStore и установленные architecture/React/TypeScript sub-skills.
Broad scan требует явного запуска improve-codebase-architecture.

## Жёсткие gates

- ui → application → domain; infrastructure реализует ports; app выполняет
  composition.
- Cross-feature imports проходят через narrow public entry/subpath.
- Deep imports, cycles, giant barrels и empty speculative layers запрещены.
- Для production React component file после 200 lines требуется decomposition
  review; более 800 lines запрещено. Tests, Stories, fixtures и generated code
  исключены.
- Один production React component на file; nested components запрещены.
- Stories создаются только для atoms/molecules.
- TanStack Query владеет server state.
- HTTP API layer генерируется Kubb с обязательными `@kubb/plugin-ts`,
  `@kubb/plugin-zod`, `@kubb/plugin-fetch` и `@kubb/plugin-react-query`.
- `@kubb/plugin-fetch` использует native `globalThis.fetch`; Axios и
  handwritten дубликаты generated transport/types/schemas/hooks запрещены.
- Fetch plugin включает `validator: "zod"`, React Query plugin —
  `client: "fetch"` и `hooks: true`.
- Engine/plugins используют одну совместимую Kubb 5 version set, generated
  runtime — `zod@4` и `@tanstack/react-query@5`; earlier major требует
  отдельной migration.
- State-manager-owned external shared client state подключается через
  useSyncExternalStore.
- react-use разрешён только для utility hooks.
- Effect разрешён только для external synchronization.
- Business logic во view/controller hook запрещена.
- Focused review проходит critical harness: coverage, adversarial candidate
  loop, counterevidence и confirmation gate обязательны для каждого finding.

## Маршрутизация REQUIRED SUB-SKILL

- **REQUIRED SUB-SKILL:** Для любого architecture work используйте
  codebase-design.
- **REQUIRED SUB-SKILL:** Для React code/review используйте
  vercel-react-best-practices; после его SKILL.md читайте только релевантные
  текущей задаче rule-файлы.
- **REQUIRED SUB-SKILL:** Для TypeScript contracts/errors используйте
  typescript-magician.
- **REQUIRED SUB-SKILL:** Для multi-file implementation/refactor или изменения,
  которое перестало быть одним minimal change, используйте
  incremental-implementation.
- **REQUIRED SUB-SKILL:** После green implementation/refactor используйте
  code-simplification.
- **REQUIRED SUB-SKILL:** При подробной работе с data-fetching используйте
  tanstack-query.
- **REQUIRED SUB-SKILL:** При создании или изменении HTTP API boundary
  используйте openapi до Kubb generation.
- **REQUIRED SUB-SKILL:** Для high-risk scope, спорного/противоречивого finding
  или дорогого cross-module решения используйте doubt-driven-development.
- **USER-INVOKED:** Для broad scan попросите пользователя явно запустить
  improve-codebase-architecture.

Перед действием прочитайте актуальный SKILL.md каждого применимого sub-skill.
Sub-skills не расширяют полномочия задачи. Явный HTTP API
implementation/refactor включает необходимую mandatory Kubb dependency set
только после её фиксации в mutation plan; в review/design dependency и code
mutation запрещены. Commit и push требуют отдельного явного запроса.

## Выберите режим

- New feature implementation или read-only structural design.
- Behavior-preserving refactor.
- Focused read-only architecture review.
- Broad scan через explicit improve-codebase-architecture invocation.

Не используйте skill для визуальной правки, styling или data-fetching без
архитектурной задачи. Не заменяйте router/framework/build tool и не создавайте
параллельную design system.

## Kubb boundary и runtime composition

Размещайте generated Kubb output в явно обозначенном infrastructure/API
boundary и считайте его read-only. Domain не импортирует transport DTOs, Zod
schemas или React Query hooks; handwritten adapter отображает generated DTO в
domain model, когда модели различаются. Feature/UI получает view-ready API
capability через handwritten feature public entry; только этот boundary module
может импортировать generated React Query options/hooks, без deep imports из UI.

Base URL настраивайте вне generated files через два раздельных composition
modules: server-only module читает project-native server env variable, client
module читает отдельную project-native public client env variable. Сначала
обнаружьте реальные имена variables и framework-specific exposure rules. Если
их нет или граница не доказана, остановитесь до writes и запросите решение. Не
придумывайте имена; в evidence не печатайте имена или значения и не импортируйте
server composition из browser-reachable graph. Не разрешайте fallback между
variables; пустое runtime value должно давать role-only fail-fast (`server base
URL`/`client base URL`) без имени или значения variable.
Server module создаёт isolated generated client через `createClient` в request
scope, browser module — один stable browser client. Feature public wrapper
передаёт соответствующий client generated query/mutation artifacts через
фактический typed Kubb v5 config parameter; server-side global `setConfig`
запрещён.
Обе runtime compositions обязаны использовать один generated operation/key
contract. Если server и browser endpoints не доказаны как семантически
эквивалентные, SSR hydration блокируется до решения.

Распределение ownership неизменно: `openapi` владеет source contract, Kubb —
generated Fetch/types/Zod/React Query artifacts, `tanstack-query` — cache
semantics, а этот skill — module boundaries, runtime composition и применение
project-native generation/drift checks. Для HTTP API задачи прочитайте актуальные
`SKILL.md` текущего skill и применимых `openapi`/`tanstack-query` один раз;
применяйте owned Kubb sections совместно, без рекурсивного запуска.

## Reference-файлы

- Всегда читайте
  [architecture-and-dependencies.md](references/architecture-and-dependencies.md).
- При state, view, Effect, SSR/RSC или browser integration читайте
  [state-and-effects.md](references/state-and-effects.md).
- При component design, extraction, size review или Atomic Design читайте
  [decomposition.md](references/decomposition.md).
- Для focused architecture review всегда читайте
  [critical-review-harness.md](references/critical-review-harness.md).
- Всегда читайте
  [workflows-and-verification.md](references/workflows-and-verification.md)
  перед выполнением и handoff.

## Рабочий процесс

1. Зафиксируйте mode и scope; изучите repository conventions, runtime, commands
   и текущий module graph.
2. Загрузите применимые sub-skills и reference-файлы.
3. Определите ownership, public interface, state owners и seam.
4. В implementation/refactor следуйте соответствующему процессу из
   `workflows-and-verification.md`; Kubb gates применяйте только когда HTTP API
   входит в scope.
5. В review/design оставайтесь read-only: не запускайте Kubb generation в
   repository или другие write-capable commands. Проверяйте существующие
   config/generated artifacts, а непроверенные generation/drift gates отмечайте
   как `needs evidence`.
6. Сообщите evidence, исключения и pre-existing failures.

## Приоритет правил

Явные требования пользователя → более строгие project conventions → этот skill
→ совместимые defaults применимых sub-skills. TanStack Query имеет приоритет
над SWR-specific advice. Dependency boundary обозначает import enforcement, а
seam — replaceable behavior.

## Gate завершения

Implementation/refactor завершены после прохождения
[своего Definition of Done](references/workflows-and-verification.md#definition-of-done-для-implementation-и-refactor).
Review/design завершены после прохождения
[review/design Definition of Done](references/workflows-and-verification.md#definition-of-done-для-review-и-design),
даже если findings фиксируют нарушения target-state gates. Без evals не
заявляйте, что behavior этого skill прошло benchmark.
