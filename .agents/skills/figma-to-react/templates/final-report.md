# Итоговый отчёт Figma в React

Подготовь предварительную версию отчёта после успешного `G7`. Замени все подсказки данными из канонических файлов. Записи о пройденном `G8` становятся действительными только после того, как выданная строка события без изменений добавлена в журнал и обычная проверка завершилась успешно.

## Содержание

- [Идентичность](#идентичность-и-область-работы), [источник](#источник-и-модель), [реализация](#реализация), [этапы](#этапы-g0-g8)
- [Q1-Q6](#проверки-q1-q6), [проект](#проверки-проекта), [браузер](#проверки-браузера), [случаи без эталона](#случаи-без-эталона)
- [Средство сравнения](#проверка-средства-сравнения), [итерации](#визуальные-итерации), [сбои](#сбои-до-сравнения), [готовность](#готовность-из-контракта)
- [Отклонения](#отклонения-и-допущения), [итог](#итог)

## Идентичность и область работы

- Задача: `<taskId>`
- Figma: `<figmaUrl>, <fileKey>, <fileVersion>, <nodeId>`
- Адрес проекта: `<origin>`
- Маршрут и модуль: `<route>, <featureModule>`
- Разрешённые корни реализации: `<точный однострочный JSON allowedImplementationRoots>`
- Включено: `<точный однострочный JSON $.scope.include>`
- Исключено: `<точный однострочный JSON $.scope.exclude>`

## Источник и модель

- Контекст Figma: `artifacts/visual/<task-id>/design-context-manifest.json` (`<SHA-256>`)
- Источники: `artifacts/visual/<task-id>/source-manifest.json` (`<SHA-256>`)
- Изменения модели во время работы — ручная запись: `<решение и подтверждение | нет>`

| requestId | operation | responseFormat | nodeId | path | checksum |
| --- | --- | --- | --- | --- | --- |
| `<requestId>` | `<operation>` | `<responseFormat>` | `<nodeId>` | `<path>` | `<checksum>` |

| sourceId | purpose | nodeId | caseId | mediaKind | logicalDimensions | pixelDimensions | path | checksum | origin | derivations | runtime |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `<sourceId>` | `<purpose>` | `<nodeId>` | `<caseId / null>` | `<mediaKind>` | `<точный JSON>` | `<точный JSON / null>` | `<path>` | `<checksum>` | `<точный JSON origin>` | `<точный JSON derivations>` | `<runtimePath, runtimeChecksum; для эталона null, null>` |

Любое значение с пометкой «точный JSON», включая `origin` и `derivations`, получай однострочным `JSON.stringify` без перестановки полей, затем выполняй замены из [правил для `issues`](#визуальные-итерации), включая замену `|` на `\u007c`. В остальных ячейках таблиц, например в `command` и `purpose`, экранируй каждый обычный `|` как `\|`.

## Реализация

- Манифест: `artifacts/visual/<task-id>/implementation-manifest.json`
- База Git: `<repositoryRoot, profile, revision>`
- Исходные изменения: `<точный однострочный JSON preExistingChanges>`
- Хеш контракта задачи: `<taskContractHash>`
- `implementationHash`: `<rootHash>`
- Идентификатор реализации: `<64 знака rootHash без sha256:>`
- Каталог версии: `artifacts/visual/<task-id>/implementations/<implementation-id>`
- Неизменяемая копия: `artifacts/visual/<task-id>/implementations/<implementation-id>/implementation-manifest.json`

| path | kind | mode | hash |
| --- | --- | --- | --- |
| `<path>` | `<file / deleted>` | `<100644 / 100755 / null>` | `<hash / null>` |

| Пакет | Статус | Назначение | Версия | package.json | Файл блокировки | Проверка блокировки | Профиль проверки |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `<packageName>` | `<status>` | `<purpose>` | `<specifier>` | `<packageJsonPath>` | `<lockfilePath>` | `<lockfileCheckId / null>` | `<lockfileCheckProfile / null>` |

## Этапы G0-G8

В подтверждении каждого этапа перечисли все канонические пути, которые относятся к текущей задаче и реализации.

| Этап | Статус | Каноническое подтверждение |
| --- | --- | --- |
| G0 | `passed` | `artifacts/visual/<task-id>/compatibility.md` |
| G1 | `passed` | `artifacts/visual/<task-id>/task-contract.json` |
| G2 | `passed` | `<design-context-manifest.json и source-manifest.json>` |
| G3 | `passed` | `<pre-code-evidence.md и capture-contract.json>` |
| G4 | `passed` | `<version-root>/implementation-manifest.json` |
| G5 | `passed` | `<version-root>/checks/q1.md`, `<version-root>/checks/q2.md`, `<version-root>/checks/q3.md`, `<version-root>/checks/q4.md` |
| G6 | `passed` | `<version-root>/checks/<project-check-id>.txt` |
| G7 | `passed` | `<полный перечень Q5, Q6, browserChecks, cases и файлов проверки средства сравнения>` |
| G8 | `passed` | `<verification-record.json и этот отчёт>` |

## Проверки Q1-Q6

| Проверка | Статус | Путь | SHA-256 |
| --- | --- | --- | --- |
| Q1 | `passed` | `<version-root>/checks/q1.md` | `<evidenceHash>` |
| Q2 | `passed` | `<version-root>/checks/q2.md` | `<evidenceHash>` |
| Q3 | `passed` | `<version-root>/checks/q3.md` | `<evidenceHash>` |
| Q4 | `passed` | `<version-root>/checks/q4.md` | `<evidenceHash>` |
| Q5 | `passed` | `<version-root>/checks/q5.md` | `<evidenceHash>` |
| Q6 | `passed` | `<version-root>/checks/q6.md` | `<evidenceHash>` |

## Проверки проекта

| id | command | status | exitCode | outputPath | outputHash |
| --- | --- | --- | --- | --- | --- |
| `<id из projectChecks>` | `<точная command>` | `passed` | `0` | `<version-root>/checks/<id>.txt` | `<outputHash>` |

## Проверки браузера

| id | command | status | exitCode | outputPath | outputHash |
| --- | --- | --- | --- | --- | --- |
| `<id из browserChecks>` | `<точная command>` | `passed` | `0` | `<version-root>/checks/<id>.txt` | `<outputHash>` |

- `keyboard`, `focus`, `accessible-name`, `contrast`: `<пути behavior-only evidence.json>`
- `overflow`, `reading-order`, `reflow`, `zoom`: `<пути responsive-only evidence.json>`
- Команда снимка: `<visualCaptureCommand>`
- Команда сравнения: `<visualCompareCommand>`
- Хеш контракта захвата: `<captureContractHash>`
- Единый отпечаток среды случаев: `<канонический JSON browser, os, container, headless, fontHashes>`
- Ошибки консоли и страницы: `<нет; пути всех evidence.json>`

## Случаи без эталона

| caseId | evidenceMode | viewport | state | Текущий файл | Неизменяемая копия |
| --- | --- | --- | --- | --- | --- |
| `<caseId>` | `<behavior-only / responsive-only>` | `<width>x<height>@<dpr>` | `<state>` | `artifacts/visual/<task-id>/<case-id>/evidence.json` | `<version-root>/cases/<case-id>/evidence.json` |

## Проверка средства сравнения

- Запись: `<version-root>/comparator-conformance.json` или `не применимо` без `visual-reference`
- Данные: `<version-root>/conformance/` или `не применимо` без `visual-reference`
- Профиль: `rgba-exact-v1`
- Канонический результат: `1 / 4 = 25`
- Статус: `passed` или `не применимо` без `visual-reference`

## Визуальные итерации

Перенеси из каждого итогового `result.json` только указанные поля. Для `issues` возьми однострочный результат `JSON.stringify(result.issues)`, замени символы U+003C, U+003E, амперсанд и `|` на строчные `\u003c`, `\u003e`, `\u0026` и `\u007c`, а U+2028 и U+2029 — на `\u2028` и `\u2029`. После этого обычного `|` в JSON уже нет, поэтому дополнительное Markdown-экранирование для этой ячейки не нужно.

| caseId | iteration | viewport | differenceRatio | status | issues | approval |
| --- | --- | --- | --- | --- | --- | --- |
| `<caseId>` | `<NNN>` | `<width>x<height>` | `<неокруглённое значение>` | `<pixel-perfect / strict-visual-accepted>` | `<точный JSON-массив issues>` | `<null / path (checksum)>` |

## Сбои до сравнения

| sequence | caseId | evidencePath |
| --- | --- | --- |
| `<sequence / нет>` | `<caseId / нет>` | `<хешированный путь / нет>` |

## Готовность из контракта

Источник строк: [правила завершения](../rules/verification-and-completion.md#итоговая-запись-и-отчёт).

### Области просмотра

Создай ровно одну строку на запись `$.viewports`. Перечисляй состояния и пути через запятую с пробелом, сохраняя порядок из контракта захвата. Если обязательных состояний нет, напиши `нет` в двух последних столбцах.

| id | Размер и DPR | Обязательные states | Подтверждения |
| --- | --- | --- | --- |
| `<viewport.id>` | `<width>x<height>@<dpr>` | `<required state ids>` | `<result.json или evidence.json>` |

### Состояния

Создай ровно одну строку на запись `$.states`. Для `required` перечисляй области просмотра в порядке контракта задачи, а пути в порядке контракта захвата, разделяя значения запятой с пробелом. Для `not-applicable` перенеси непустое `evidence`.

| id | applicability | Области просмотра | Подтверждения |
| --- | --- | --- | --- |
| `<state.id>` | `<required / not-applicable>` | `<все viewport ids / не применимо>` | `<пути случаев / evidence>` |

## Отклонения и допущения — ручная оценка

- Прочие согласованные отклонения, не заменяющие `approval` визуальной итерации: `<владелец, область, причина и подтверждение | нет>`
- Оставшиеся допущения: `<допущение и влияние | нет>`

## Итог

- Запись проверки: `artifacts/visual/<task-id>/verification-record.json` (`<SHA-256>`)
- Журнал: `artifacts/visual/<task-id>/evidence-log.jsonl` (`<последняя sequence>, <implementationHash>`)
- Условие завершения: `обе команды возвращают код 0`
- Результат: `G8 passed`
