---
type: workflow
title: Быстрый старт и навигация
description: Быстрый старт и навигация в Next.js Starter, инструкции и проверяемые контракты.
tags: [nextjs, starter, workflow]
sources:
  - id: openwiki-source-5b54a58d1b51cd490b0e7162
    resource: repo://package.json
generated: { by: "codex", at: "2026-11-16T14:24:53.735Z" }
verified:
  - by: openwiki/0.7.2
    at: 2026-11-16T14:30:17.316Z
---

# Быстрый старт и навигация

Node.js 26.13.1 в ветке 26.x и npm 11.x. Репозиторий использует один manifest без workspaces.

```bash
npx create-next-app@latest my-app --example https://github.com/webpractik/nextjs-starter --use-npm
cd my-app
npm ci
test -e .env || cp .env.example .env
npm run dev
```

Откройте http://localhost:3000. Сверьте локальные переменные с примером перед запуском.

Документация ниже описывает код проекта. Карта [компонентов](../COMPONENTS.md) помогает выбрать готовый UI.

## Если вы здесь впервые

1. Запустите проект по [быстрому старту](../README.md#быстрый-старт).
2. Проверьте обязательные [переменные окружения](operations/environment.md).
3. Перед первым изменением прочитайте [про слои и границы](architecture/overview.md).
4. Перед отправкой изменений выберите проверки в [руководстве по тестированию](testing/testing.md).

## Разработка

| Задача                               | Документ                                   |
| ------------------------------------ | ------------------------------------------ |
| Понять, куда добавить код            | [Архитектура](architecture/overview.md)             |
| Изменить API или использовать facets | [Генерация API-клиента](development/api-codegen.md)    |
| Добавить UI-компонент или форму      | [Компоненты `#/components/ui`](ui/core.md) |
| Написать или запустить тест          | [Тестирование](testing/testing.md)      |

Карта существующих компонентов: [src/components](../COMPONENTS.md).

## Данные и runtime

| Задача                                | Документ                                          |
| ------------------------------------- | ------------------------------------------------- |
| Настроить `.env`                      | [Переменные окружения](operations/environment.md)            |
| Понять путь запроса к backend         | [BFF proxy и API transport](architecture/bff-proxy.md)         |
| Работать без доступного backend       | [Режим моков](development/mock-mode.md)                       |
| Выбрать загрузку и кеширование данных | [Кеширование и streaming](architecture/cache-and-streaming.md) |

## Production и эксплуатация

| Задача               | Документ                    |
| -------------------- | --------------------------- |
| Настроить deployment | [Deployment](operations/deployment.md) |

## Что считать источником истины

Код и конфигурация приоритетнее документации. Правила работы — в [`AGENTS.md`](../AGENTS.md).

## Диагностика

[Наблюдаемость](operations/observability.md) описывает логи, метрики, трассировку и ограничения health/readiness.
