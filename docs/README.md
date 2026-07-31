# Документация проекта

> Тип: навигация · Статус: актуально · Источник истины: ссылки ниже и исполняемые конфиги

Этот индекс помогает выбрать документ по задаче. При расхождении документа с кодом приоритет имеют
исполняемый конфиг, схема environment или реализация, затем `AGENTS.md`.

| Документ                                      | Тип                  | Статус   | Когда читать                                             |
| --------------------------------------------- | -------------------- | -------- | -------------------------------------------------------- |
| [Architecture](architecture.md)               | Объяснение           | Актуален | Размещение кода, слои, Server/Client boundaries          |
| [API codegen](api-codegen.md)                 | How-to + справочник  | Актуален | OpenAPI 3.2, Redocly, Kubb и generated artifacts         |
| [BFF proxy](bff-proxy.md)                     | Объяснение           | Актуален | Выбор API base URL, rewrite, cookies и CORS              |
| [Environment](environment.md)                 | Справочник           | Актуален | Переменные, область видимости и момент чтения            |
| [Mock mode](mock-mode.md)                     | How-to + справочник  | Актуален | Работа без backend, cookies, scenarios и generated mocks |
| [Cache and streaming](cache-and-streaming.md) | Объяснение + правила | Актуален | Cache Components, Suspense, tags и инвалидация           |
| [Testing guidelines](testing-guidelines.md)   | Справочник           | Актуален | Имена файлов, Vitest projects, Playwright и Storybook    |
| [Deployment](deployment.md)                   | How-to + ограничения | Актуален | Standalone build, Docker, GitLab CI и probes             |

Публичный быстрый старт находится в [`README.md`](../README.md), а правила для coding agents — в
[`AGENTS.md`](../AGENTS.md). Согласованные design/implementation plans под `docs/superpowers/`
являются историей решений и не заменяют документацию текущего состояния.
