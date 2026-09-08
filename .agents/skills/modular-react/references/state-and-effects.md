# Состояние, view и Effects

## Когда читать

Читайте этот reference при выборе владельца state, проектировании external
store, проверке view/controller hook, работе с react-use, useEffect, CSR, SSR
или RSC.

## Содержание

- [Владение state](#владение-state)
- [Контракт external store](#контракт-external-store)
- [CSR, SSR и RSC](#csr-ssr-и-rsc)
- [Политика react-use](#политика-react-use)
- [Лестница решений перед Effect](#лестница-решений-перед-effect)
- [Допустимый Effect](#допустимый-effect)
- [Запрещённые Effect patterns](#запрещённые-effect-patterns)
- [Граница view](#граница-view)
- [Контрольный список](#контрольный-список)

## Владение state

| Вид state | Owner |
| --- | --- |
| Ephemeral UI state | useState/useReducer |
| URL/navigation | router проекта |
| Server state | TanStack Query |
| State-manager-owned external shared client state | framework-neutral store + useSyncExternalStore |
| Browser capability state | browser; react-use hook является React adapter |
| Stable dependencies/config | Context |

TanStack Query является единственным owner server state. Не копируйте Query
data в local state, Context или external store. Query keys, cache policy,
mutations, prefetching и hydration принадлежат отдельному skill
`tanstack-query`.

Context передаёт только stable dependencies/config, включая stable store
instance. Не используйте Context как контейнер mutable state.

Любой state manager для external shared client state скрывайте за
framework-neutral store contract и подключайте через feature hook на
useSyncExternalStore. Прямые vendor hooks такого state manager из components
запрещены: и primary, и альтернативный client-state channel должны проходить
через один contract. Правило не относится к TanStack Query server cache и
utility hooks react-use: browser остаётся owner соответствующего capability
state, а hook является только React adapter.

## Контракт external store

```typescript
import { useSyncExternalStore } from 'react'

export interface ExternalStore<TSnapshot, TCommands> {
  getSnapshot(): TSnapshot
  subscribe(listener: () => void): () => void
  readonly commands: TCommands
  getServerSnapshot?(): TSnapshot
}

export function useFeatureSnapshot<TSnapshot, TCommands>(
  store: ExternalStore<TSnapshot, TCommands>,
): TSnapshot {
  return useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  )
}
```

Snapshot должен быть immutable и referentially stable до реального изменения.
`subscribe` возвращает unsubscribe. В CSR `getServerSnapshot` можно не
предоставлять; в SSR его snapshot совпадает с первым client snapshot. Store
изменяется через явные typed `commands`, а не через mutation snapshot. Функции
контракта и commands имеют stable identity и не зависят от потерянного `this`.
Request-specific data не хранится в process-wide module state.

## CSR, SSR и RSC

- В CSR hook использует subscribe/getSnapshot, может не передавать
  getServerSnapshot и не создаёт дублирующий state.
- Для SSR обязателен getServerSnapshot; его результат должен совпасть с первым
  client snapshot, чтобы hydration была детерминированной.
- Hook с useSyncExternalStore находится только в client module. Server
  Components не подписываются на client store.
- Initial config передаётся в сериализуемом виде; server-only dependencies не
  попадают в client graph.
- Store с request-specific state не разделяется между server requests.

## Политика react-use

Используйте react-use только для browser/UI utilities: media, measurements,
clipboard, visibility и аналогичных capabilities. Не используйте его как state
manager, fetching layer или место business workflow. Проверяйте typed direct
import либо project-native optimizePackageImports; deep import с implicit any
запрещён. Browser владеет этим capability state; hook только адаптирует его в
React и не становится вторым client-state owner. Подтвердите lifecycle
выбранного hook для фактической CSR/SSR/RSC ветки.

## Лестница решений перед Effect

1. Вычислить значение во время render.
2. Выполнить действие в event handler.
3. Передать server state TanStack Query.
4. Подключить state-manager-owned external shared client state через
   useSyncExternalStore.
5. Использовать Effect только для synchronization с external system.

## Допустимый Effect

- Называет external system.
- Синхронизирует subscription, timer, imperative DOM или third-party widget.
- Идемпотентен.
- Имеет symmetric cleanup, если setup создаёт subscription, timer, connection
  или другую отменяемую operation/освобождаемую resource.
- Для idempotent write-only synchronization без acquired resource явно
  подтверждает, почему cleanup не нужен.
- Переживает Strict Mode remount.
- Содержит честный dependency list.
- Не принимает domain decisions.

## Запрещённые Effect patterns

- Любой useEffect, который не синхронизируется с названной external system.
- Derived state или prop-to-state synchronization.
- Event action, смоделированный как state + Effect.
- Manual fetching вместо TanStack Query.
- Validation, permissions, pricing или workflow.
- Подписка на store через useState + Effect вместо useSyncExternalStore.

## Граница view

View разрешены JSX, accessibility, formatting готовой view model, ephemeral UI
state, focus/selection и forwarding events. Domain rules, authorization,
pricing, eligibility, normalization, DTO mapping и use-case orchestration
остаются в domain/application/infrastructure.

Controller hook адаптирует callbacks/status, но не становится скрытым business
layer.

## Контрольный список

- [ ] У каждого state ровно один owner.
- [ ] Query state не дублируется.
- [ ] External store соблюдает subscribe/getSnapshot/commands contract, а при
  SSR также предоставляет getServerSnapshot.
- [ ] Каждый Effect дошёл до пятого шага decision ladder и имеет cleanup там,
  где setup создаёт отменяемую operation или освобождаемую resource.
- [ ] View получает view-ready data и callbacks.
