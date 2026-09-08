# Архитектура и зависимости

## Когда читать

Читайте этот reference при создании feature, выборе module/interface/seam,
изменении imports, проектировании public surface, работе с CSR/SSR/RSC или
классификации UI по Atomic Design.

## Содержание

- [Неподвижные инварианты](#неподвижные-инварианты)
- [Карта modules](#карта-modules)
- [Минимальная структура](#минимальная-структура)
- [Публичные interfaces](#публичные-interfaces)
- [Atomic Design как UI-ось](#atomic-design-как-ui-ось)
- [CSR, SSR и RSC](#csr-ssr-и-rsc)
- [Проверка boundaries](#проверка-boundaries)
- [Контрольный список архитектурного ревью](#контрольный-список-архитектурного-ревью)

## Неподвижные инварианты

- Feature-first определяет ownership и locality.
- Внутренние layers появляются только при фактической ответственности.
- Dependency direction: ui → application → domain.
- Infrastructure реализует ports и зависит от application/domain contracts.
- App является composition root.
- Dependency boundary означает import rule; seam означает место заменяемого
  поведения.
- Предпочитайте deep modules: небольшой interface скрывает значительную
  implementation complexity; shallow pass-through wrappers не создают depth.

## Карта modules

| Module | Владеет | Не может знать |
| --- | --- | --- |
| app | composition, providers, router, cross-feature coordination | feature internals |
| domain | invariants, policies, domain values | React, DOM, Query, transport |
| application | use cases, ports, orchestration | concrete adapters |
| infrastructure | API, storage, browser adapters, DTO/error mapping | view decisions |
| ui | view models, JSX, accessibility, UI events | business rules, transport DTO |
| shared | domain-neutral primitives | feature-specific concepts |

Повторение в двух features само по себе не переносит код в shared. Сначала
докажите domain-neutral contract и стабильный reuse.

## Минимальная структура

```text
src/
├── app/
├── features/
│   └── orders/
│       ├── domain/
│       ├── application/
│       ├── infrastructure/
│       ├── ui/
│       └── public/
└── shared/
```

Не создавайте пустые layers. Простая feature может начинаться только с ui.

## Публичные interfaces

Публикуйте узкие explicit exports. Не используйте `export *` и giant root
barrels. При широкой feature создавайте typed subpath entry points.

```typescript
// features/orders/public/order-summary.ts
export { OrderSummary } from '../ui/organisms/OrderSummary'
export type { OrderSummaryProps } from '../ui/organisms/OrderSummary'
```

Потребители импортируют public path и не знают внутренний layout:

```typescript
import { OrderSummary } from '@/features/orders/public/order-summary'
```

## Atomic Design как UI-ось

| Уровень | Ownership и назначение |
| --- | --- |
| shared/ui/atoms | domain-neutral primitives |
| shared/ui/molecules | общие малые UI-композиции |
| features/orders/ui/molecules | feature-specific малые композиции |
| features/orders/ui/organisms | самостоятельные feature sections |
| app/ui/templates | page layout и slots без concrete data |
| app/ui/pages | route-level composition с real state |

Зависимости в коде направлены page → template → organism → molecule → atom.
Обратные imports запрещены. Atomic category не переносит feature ownership в
shared. Пустые Atomic Design folders заранее не создаются. Не создавайте
параллельную design system: переиспользуйте существующие UI primitives и tokens.

## CSR, SSR и RSC

- Browser-only integrations остаются в explicit client module.
- Server-only modules не попадают в client graph.
- Request data не хранится в mutable module scope.
- Composition и hydration следуют framework conventions проекта.

## Проверка boundaries

Сначала используйте существующий ESLint, dependency-cruiser, package exports
или эквивалентный validator. Новую dependency согласуйте до изменения manifest.
После настройки временно добавьте запрещённый import, докажите expected failure
и удалите import.

## Контрольный список архитектурного ревью

- [ ] Module ownership однозначен.
- [ ] Public interface скрывает internals, существенно уже implementation и
  даёт leverage.
- [ ] Interface является test surface и позволяет тестировать behavior без
  знания internals.
- [ ] Seam существует только там, где оправданы adapters.
- [ ] Deletion test подтверждает depth: при удалении или замене module с
  сохранением observable behavior скрытая complexity возвращается в callers;
  если complexity исчезает, module был pass-through. Несвязанные consumers не
  изменяются.
- [ ] Cross-feature imports проходят через narrow public surface.
- [ ] Deep imports и cycles отсутствуют.
- [ ] Atomic Design не нарушает feature ownership.
- [ ] Server/client imports безопасны.
