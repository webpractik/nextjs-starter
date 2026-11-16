---
type: reference
title: Автоматическая проверка импортов
description: Проверяемые границы check:imports, маркеры domain/application, разрешённые и запрещённые импорты, диагностика и пределы автоматической проверки.
tags: [architecture, imports, boundaries, validation, clean-architecture]
sources:
  - id: openwiki-source-362e06c30ccfdafd87339cb0
    resource: repo://ARCHITECTURE.md
  - id: openwiki-source-72b816a72bb5f72d95b334ea
    resource: repo://lefthook.yml
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
  - id: openwiki-source-13445c2f1001b83805761c34
    resource: repo://tests/unit/tools/check-imports.unit.test.ts
  - id: openwiki-source-5a9de896f4709eefddfc5d99
    resource: repo://tools/check-imports.mjs
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:41:39.256Z
---

# Автоматическая проверка импортов

`npm run check:imports` проверяет зависимости исходников по
[архитектурному контракту](../../ARCHITECTURE.md). Реализация находится в
[`tools/check-imports.mjs`](../../tools/check-imports.mjs), примеры поведения в
[`tests/unit/tools/check-imports.unit.test.ts`](../../tests/unit/tools/check-imports.unit.test.ts).

## Запуск и pre-commit

Из корня проекта:

```bash
npm run check:imports
npm run verify:fast
```

`verify:fast` последовательно запускает `check:structure`, `check:imports`, formatter,
lint и TypeScript. Если проверка импортов завершается с ошибкой, команда не запускает следующие этапы.
Pre-commit Lefthook уже вызывает `verify:fast`, поэтому отдельный hook для импортов не нужен.
Установите hook по [инструкции README](../../README.md#быстрый-старт).

При успешной проверке команда выводит `Архитектурные границы импортов проверены.`.
При нарушениях она печатает диагностику и завершается с кодом `1`.

## Какие импорты входят в граф

Скрипт начинает обход с `app/` и `src/`. Он разбирает JS/TS-файлы через AST Oxc,
включая JSX/TSX и варианты расширений m/c. Затем он следует по локальным зависимостям,
поэтому импортированный helper в корне тоже попадает в граф.

Проверяются обычные, побочные и type-only imports, `export ... from`, `export * from`,
строковые `import()` и `require()`, TypeScript `import('...').Type` и import-equals.
Архитектурные правила действуют и для импортов типов.

Относительные пути и алиасы из `compilerOptions.paths` разрешаются в реальные пути
файлов. Поддерживаются точные алиасы и шаблоны с конечной `*`, массивы целевых путей,
`baseUrl`, расширения исходников и `index`. Ссылка с JS-расширением может разрешиться
в TS-исходник. Скрипт проверяет найденный файл, поэтому замена `#/` на `../`
не снимает ограничение.

Синтаксическая ошибка, неразрешённый локальный импорт, локальный путь вне проекта или
вычисляемый путь в распознанном import/require приводят к ошибке. Вместо
`import(target)` нужен строковый литерал. Существующие CSS, JSON и другие ресурсы
могут разрешаться как файлы, но их содержимое не разбирается как JS/TS.

## Проверяемые границы

Все применимые правила действуют одновременно. Другой модуль или общий код не может
зависеть от модуля, даже если тот предоставляет публичный экспорт.

| Откуда | Ограничение |
| --- | --- |
| Общий `src/*` вне `src/modules/` | Не зависит от `app/` и доменных модулей |
| `src/modules/<name>/` | Не зависит от `app/` и другого модуля |
| `src/components/ui/` | Не зависит от API, env, маршрутов и доменных модулей |
| Внешний потребитель модуля | Использует его корневой `index`, `server` или `client`, а не внутренний файл |
| Код вне `src/api/` | Использует `index.ts`, `client.ts`, `query.ts`, `schemas.ts`, `mocks.ts` или `cache-tags.ts` этого каталога |
| Внешний потребитель каталога компонента | Использует его корневой `index.ts`, `index.tsx`, `index.js` или `index.jsx` |
| Код вне родительского дерева route-local `_components/` | Не импортирует этот приватный UI |
| Проверяемый runtime-код | Не импортирует `src/tests/` |

Правило публичного index компонента применяется к каталогам
`src/components/{ui,providers,utilities}/<name>/`. Оно не требует отдельного
index для одиночного файла utility. Внутри каталога компонента можно импортировать
его реализацию напрямую. Вложенный `fields/index` не становится публичным входом для внешнего кода.

Границы shared, modules, UI и чистых слоёв проверяются также транзитивно. Например,
`src/utils/a.ts → bridge.ts → app/page.ts` нарушает запрет shared → app, даже если
первый импорт указывает на helper в корне. Реэкспорт не скрывает зависимость.
Ограничения публичных входов и route-local UI проверяются на отдельных рёбрах графа.

## Маркеры domain и application

Каталог с точным именем `domain/` или `application/` определяет чистый слой файла.
В плоском сценарии вместо дополнительного каталога используется начальный JSDoc-маркер:

```ts
/** @architecture domain */

export interface Product {
    name: string
}
```

```ts
/** @architecture application */

import type { Product } from './product'

export interface SaveProductPort {
    save(product: Product): Promise<void>
}

export function saveProduct(product: Product, port: SaveProductPort) {
    return port.save(product)
}
```

Пример показывает два соседних файла `product.ts` и `save-product.ts`. Такого сценария
в стартере нет. Порт принадлежит application, а конкретный SDK-адаптер передаётся
из композиции. Обычный интерфейс с `Promise` не создаёт импорт IO-библиотеки.

Маркер стоит первым в файле, до imports, directives и других комментариев.
Начальные пробелы разрешены. Отдельный комментарий или `'use client'` перед маркером
мешает его распознаванию. Каталог слоя имеет приоритет над маркером. Не вкладывайте
`domain/` и `application/` друг в друга. Скрипт выбирает первое совпадение в пути.

По контракту маркер обязателен для плоских чистых правил и use cases. Скрипт не может
определить бизнес-смысл непомеченного файла, поэтому полноту разметки проверяют при ревью.

В обоих чистых слоях запрещены прямые и транзитивные зависимости от:

- `react`, `react-dom`, `next` и их subpaths, пакеты `@tanstack/*`;
- встроенные Node-модули, в том числе с `node:`, `server-only`, `client-only` и `adze`;
- `src/api/`, `src/env/`, `src/observability/`, `src/mock-mode/`, `src/proxy/`, `src/components/`;
- файлы внутри `adapters/`, `_components/` и файлы с суффиксом `.server` перед расширением.

Domain также не может зависеть от распознанного application. Application может
использовать domain. Сам суффикс `.server.ts` не является маркером domain/application.

## Разрешённые примеры

Пути ниже показывают применение правил. Примеры предполагают, что целевые файлы существуют,
экспортируют указанные имена и имеют только разрешённые зависимости. Успешная проверка `check:imports`
не заменяет проверку экспортируемых имён через TypeScript.

| Файл-потребитель | Импорт | Причина |
| --- | --- | --- |
| `app/products/page.tsx` | `import { loadProducts } from '#/modules/products/server'` | Маршрут использует публичную серверную композицию модуля |
| `src/modules/products/server.ts` | `import { saveProduct } from './application/save-product'` | Внутренняя композиция своего модуля |
| `src/modules/products/application/save-product.ts` | `import type { Product } from '../domain/product'` | Application зависит от domain |
| `src/modules/products/adapters/api.ts` | `import { getPetById } from '#/api'` | Адаптер обращается к публичному SDK |
| `app/products/_components/product-form.tsx` | `import { Button } from '#/components/ui/button'` | Используется публичный index компонента |
| `src/components/ui/button/index.ts` | `export { Button } from './button'` | Реэкспорт собственной реализации |

## Запрещённые примеры

| Файл-потребитель | Импорт | Нарушение и исправление |
| --- | --- | --- |
| `src/utils/format.ts` | `import '@/products/page'` | Общий код зависит от маршрута; передайте данные из маршрута |
| `src/modules/orders/server.ts` | `import '#/modules/products'` | Модули связаны напрямую; соберите взаимодействие в `app/` |
| `app/products/page.tsx` | `import '#/modules/products/adapters/api'` | Обход публичного входа; экспортируйте операцию через `server` |
| `app/products/page.tsx` | `import type { Pet } from '#/api/codegen/types/Pet'` | Generated deep import; используйте публичный facet с нужным типом |
| `app/products/page.tsx` | `export * from '#/components/ui/button/button'` | Обход index компонента |
| `app/products/page.tsx` | `import '#/components/ui/form/fields/index'` | Вложенный index не является публичным входом формы |
| `src/components/ui/button/button.tsx` | `import('#/env/server')` | UI зависит от env; передайте необходимое безопасное значение через props |
| `app/orders/page.tsx` | `import '../products/_components/product-form'` | Чужой route-local UI; выделите действительно общий компонент |
| `src/modules/products/domain/product.ts` | `type Config = import('next').NextConfig` | Даже типовая зависимость domain от framework запрещена |
| `src/modules/products/domain/product.ts` | `import '../application/save-product'` | Domain зависит от application |
| `app/products/save-product.ts` с маркером application | `require('child_process')` | Чистый слой зависит от встроенного Node-модуля |
| `app/products/page.tsx` | `import(target)` | Путь вычисляется во время выполнения |

Не исправляйте нарушение удалением маркера или заменой import на реэкспорт.
Перенесите IO в адаптер, передайте зависимость через порт либо измените владельца кода
согласно [руководству vertical slice](../development/vertical-slice.md).

## Диагностика и проверки

Для прямой ошибки диагностика содержит файл, строку, правило, исходный specifier и найденную цель.
Для транзитивной ошибки она содержит исходный файл и цепочку зависимостей. Например:

```text
src/utils/a.ts: запрещённая зависимость ~/bridge → @/page
```

После исправления выполните `npm run check:imports`, затем `npm run verify:fast`.
Если меняется сама проверка, запустите её поведенческие тесты:

```bash
npx vitest run tests/unit/tools/check-imports.unit.test.ts --project unit
```

Тесты создают временные деревья файлов и проверяют запрещённые границы, разрешённую
композицию, type/dynamic imports, реэкспорты, маркеры и ошибки разрешения путей.
Текущее приложение проверяется отдельным запуском `check:imports`.

## Ограничения

- Скрипт строит граф зависимостей и не анализирует выполнение. Он не проверяет глобальные
  `fetch`, `window`, `process.env`, содержимое функций, авторизацию и секреты.
- Проверка не доказывает правильность RSC-композиции, сериализации props
  и разделения server/client exports. Для этого нужны Next build, правила RSC и ревью.
- Непомеченная бизнес-логика вне `domain/` и `application/` не распознаётся как чистый слой.
  Роли UI и адаптеров тоже определяются путями, а не семантикой функции.
- Сторонние npm-пакеты не обходятся. Запрет внешних зависимостей чистого слоя задан
  конкретными именами и префиксами, а не свойствами произвольной библиотеки.
- Resolver читает корневой tsconfig через `JSON.parse`, без JSONC и наследования `extends`.
  Это не полный TypeScript resolver. Имя без относительного префикса
  и без совпадения с `paths` считается внешней зависимостью.
- `tests/`, `stories/`, `tools/` не являются начальными точками обхода; локальный файл
  оттуда попадает в граф, если на него ссылается уже включённый исходник.
- Для `src/tests/` и `src/api/codegen/` пропускаются собственные архитектурные проверки.
  Скрипт всё равно разбирает эти файлы и обходит их зависимости при транзитивной проверке
  из проверяемого исходника. Синтаксические ошибки и неразрешённые импорты остаются ошибками.
- Скрипт не проверяет отсутствие циклов, количество маршрутов-потребителей модуля
  или качество тестов. Эти требования нельзя выводить из успешного завершения команды.

Принципы размещения описаны в [обзоре архитектуры](overview.md). Остальные проверки
и их команды перечислены в [руководстве тестирования](../testing/testing.md).
