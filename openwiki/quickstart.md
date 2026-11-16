---
type: workflow
title: Быстрый старт и навигация
description: Быстрый старт и навигация в Next.js Starter, инструкции и проверяемые контракты.
tags: [nextjs, starter, workflow]
sources:
  - id: openwiki-source-8037e2358a2c4f9b2c722a11
    resource: repo://AGENTS.md
  - id: openwiki-source-362e06c30ccfdafd87339cb0
    resource: repo://ARCHITECTURE.md
  - id: openwiki-source-8f2fa3c7cdb9e50628621d36
    resource: repo://COMPONENTS.md
  - id: openwiki-source-ca9eabc24825e6ff0edc2967
    resource: repo://DESIGN.md
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T15:55:30.306Z
---

# Быстрый старт и навигация

Используйте Node.js 26.13.1 в ветке 26.x и npm 11.x. В репозитории один manifest без workspaces.

```bash
npx create-next-app@latest my-app --example https://github.com/webpractik/nextjs-starter --use-npm
cd my-app
npm ci
test -e .env || cp .env.example .env
npm run dev
```

Откройте http://localhost:3000. Сверьте локальные переменные с примером перед запуском.

Документация описывает код проекта. Выбрать готовый UI помогает [карта компонентов](../COMPONENTS.md).

## Если вы здесь впервые

1. Запустите проект по [быстрому старту](../README.md#быстрый-старт).
2. Проверьте обязательные [переменные окружения](operations/environment.md).
3. Перед первым изменением прочитайте [руководство по vertical slice и clean architecture](architecture/overview.md).
4. Перед отправкой изменений выберите проверки в [руководстве по тестированию](testing/testing.md).

## Разработка

| Задача                               | Документ                                   |
| ------------------------------------ | ------------------------------------------ |
| Понять, куда добавить код            | [Архитектура](architecture/overview.md)             |
| Проверить границы импортов и маркеры чистых слоёв | [Справочник check:imports](architecture/import-boundaries.md) |
| Добавить пользовательский сценарий и его тесты | [Vertical slice на практике](development/vertical-slice.md) |
| Изменить API или использовать facets | [Генерация API-клиента](development/api-codegen.md)    |
| Добавить UI-компонент или форму      | [Компоненты `#/components/ui`](ui/core.md) |
| Написать или запустить тест          | [Тестирование](testing/testing.md)      |

Перед изменением UI прочитайте [COMPONENTS.md](../COMPONENTS.md) и [DESIGN.md](../DESIGN.md).
Карта помогает выбрать готовый компонент. Обновляйте её при изменении src/components.
В документе дизайна описаны токены и правила оформления. Обновляйте его вместе с общими
стилями, шрифтами и визуальными вариантами. Порядок работы и проверка design.md описаны
в [руководстве адаптации стартера](development/adapting-starter.md).

| Задача | Документ |
| --- | --- |
| Настроить внутренние ссылки и проверить предзагрузку | [ForesightJS](ui/link-prefetching.md) |
| Создать форму с валидацией, отправкой и ошибками API | [Формы](ui/forms.md) |
| Заменить стартовые metadata, настроить индексацию и оформление | [Адаптация стартера](development/adapting-starter.md) |
| Разобраться с responsive, ErrorBoundary и providers Storybook | [Инфраструктура UI](ui/core.md) |

## Данные и runtime

| Задача                                | Документ                                          |
| ------------------------------------- | ------------------------------------------------- |
| Настроить `.env`                      | [Переменные окружения](operations/environment.md)            |
| Понять путь запроса к backend         | [BFF proxy и API transport](architecture/bff-proxy.md)         |
| Работать без доступного backend       | [Режим моков](development/mock-mode.md)                       |
| Выбрать загрузку и кеширование данных | [Cache Components, Partial Prefetching, TanStack Query и codegen](architecture/cache-and-streaming.md) |
| Уточнить API кеша, сроки и инвалидацию Next.js 16.4.6 | [Справочник Cache Components](architecture/next-cache-components.md) |
| Разобраться с App Shell, стадиями prefetch и instant navigation | [Справочник Partial Prefetching](architecture/next-partial-prefetching.md) |
| Найти официальное руководство, API или диагностику | [Каталог источников Cache Components и Partial Prefetching](architecture/next-cache-prefetching-sources.md) |

## Production и эксплуатация

| Задача               | Документ                    |
| -------------------- | --------------------------- |
| Настроить развёртывание | [Deployment](operations/deployment.md) |

## Что считать источником истины

Код и конфигурация определяют фактическое поведение. Решения о границах
сценариев, чистой логике и адаптерах Next.js описаны в
[ARCHITECTURE.md](../ARCHITECTURE.md). Правила работы находятся в
[`AGENTS.md`](../AGENTS.md), а OpenWiki объясняет применение этих правил и связь с кодом.

## Диагностика

[Наблюдаемость](operations/observability.md) описывает логи, метрики, трассировку и ограничения health/readiness.
