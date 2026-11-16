---
type: workflow
title: Адаптация стартера под продукт
description: Замена стартовых metadata, настройка индексации, выбор компонентов и синхронизация DESIGN.md и COMPONENTS.md с реализацией.
tags: [starter, onboarding, design, metadata]
sources:
  - id: openwiki-source-8037e2358a2c4f9b2c722a11
    resource: repo://AGENTS.md
  - id: openwiki-source-850cd942fe1e04537aa0d1df
    resource: repo://app/layout.tsx
  - id: openwiki-source-8ca4b277204ba6faeb44050d
    resource: repo://app/manifest.ts
  - id: openwiki-source-4791b0fabfc1634fdd5db7ed
    resource: repo://app/robots.ts
  - id: openwiki-source-194b6fdfb0ae1c3f25c84f0d
    resource: repo://app/sitemap.ts
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
    at: 2026-11-16T15:52:45.490Z
---

# Адаптация стартера под продукт

Перед публикацией пройдите этот список. Он задаёт порядок адаптации шаблона.
Выполнение списка само по себе не подтверждает готовность продукта к production.

## Название, адреса и индексация

| Что проверить | Источник | Текущее состояние |
| --- | --- | --- |
| Название и описание страниц | [app/layout.tsx](../../app/layout.tsx) | Next Starter и Default starter for projects |
| Текст главной страницы | `app/(public)/(home)/_components/hero.tsx` | Презентация шаблона |
| Название и иконки установленного приложения | [manifest.ts](../../app/manifest.ts) | Next.js App, favicon.ico, белые цвета |
| Правила индексации | [robots.ts](../../app/robots.ts) | Запрещён весь сайт: disallow `/` для `*` |
| Публичные страницы sitemap | [sitemap.ts](../../app/sitemap.ts) | Один адрес из NEXT_PUBLIC_FRONT_URL |
| Иконка | public/favicon.ico | Стартовая иконка |

Для публичного сайта разрешайте индексацию осознанно и добавляйте в sitemap только публичные URL.
Для закрытого стенда robots не заменяет контроль доступа. Переменные HTTP_AUTH_LOGIN/PASS
сами по себе не включают HTTP-аутентификацию в приложении.

Уточните title, description и социальные metadata на уровне продукта и маршрутов.
После изменений проверьте HTML, `/robots.txt`, `/sitemap.xml` и `/manifest.webmanifest`
в production-сборке. Проверьте реальный публичный домен и отсутствие закрытых URL.

## Как пользоваться COMPONENTS.md, DESIGN.md и OpenWiki

| Документ | Когда читать | Когда обновлять |
| --- | --- | --- |
| [ARCHITECTURE.md](../../ARCHITECTURE.md) | До добавления сценария или изменения границ; выбрать route-local код, модуль и адаптеры | Пересмотр архитектурного решения вместе с AGENTS.md и OpenWiki |
| [COMPONENTS.md](../../COMPONENTS.md) | До добавления UI, формы или provider; найти готовый компонент и публичный импорт | Добавление, перенос, удаление или изменение назначения общих компонентов |
| [DESIGN.md](../../DESIGN.md) | До создания, изменения и ревью UI; выбрать цвета, типографику, варианты и размеры | Изменение общих токенов, шрифта, визуальных вариантов или правил оформления |
| [UI в OpenWiki](../ui/core.md) | Разобраться с поведением и ограничениями общих компонентов | Изменение публичного поведения и рабочих сценариев |
| [Формы](../ui/forms.md) | Создать валидируемую форму и связать с SDK | Изменение соглашений полей, отправки и ошибок |

COMPONENTS.md описывает `src/components/`. Route-local UI из `app/.../_components/`
туда не входит. Точные props и экспорты проверяйте в публичных index и зеркальном
каталоге `stories/src/components/`.
DESIGN.md описывает визуальный контракт в формате design.md и не применяется к CSS автоматически.
Код остаётся источником истины. Обновляйте описание вместе с реализацией.

Стартер использует светлую палитру slate, локальный Geist Sans, Base UI и варианты CVA.
Чёрное оформление Hero относится к главной странице. Глобальная тёмная тема не задана.
При ребрендинге начните с `src/styles/globals.css`, `src/fonts/` и вариантов `src/components/ui/`,
затем обновите DESIGN.md. Добавленный общий компонент внесите в COMPONENTS.md.
Добавьте story в `stories/` и проверьте интерактивность тестом в `tests/component/`.
Пути после этих префиксов повторяют путь исходника. Проверьте их через `npm run check:structure`.

Первый продуктовый сценарий добавляйте по [руководству vertical slice](vertical-slice.md).
Локальная логика остаётся рядом с маршрутом. Общий модуль нужен, когда его используют минимум два маршрута.
Выделяйте чистые правила и use case при появлении бизнес-логики. Для простого чтения API
достаточно публичного SDK или Query options.

Проверка документа дизайна:

```bash
npx --yes --package=@google/design.md@0.4.0 designmd lint DESIGN.md
```

Команда проверяет формат документа, но не совпадение оформления с браузером и не accessibility.
Оформление проверяйте на реальном экране, включая работу с клавиатурой, фокус и состояния ошибок.

## Подключение API и production-окружения

1. Замените пример Petstore в OpenAPI контрактом продукта и выполните полный
   [pipeline генерации](api-codegen.md). Generated файлы вручную не редактируйте.
2. Настройте [env](../operations/environment.md). NEXT_PUBLIC значения фиксируются
   при build. Серверные URL и секреты передавайте также при runtime.
3. Выключите оба mock-флага для релиза. Моки не сохраняют состояние после мутаций.
4. Проверьте production browser API. Он обращается к NEXT_PUBLIC_BACK_URL напрямую.
   Согласуйте CSP, CORS и cookies по [описанию BFF](../architecture/bff-proxy.md).
5. Для данных выберите [Cache Components, Partial Prefetching и Query](../architecture/cache-and-streaming.md).
   В шаблоне включены оба флага Next.js. Для клиентских мутаций нужна отдельная инвалидация.
6. Настройте сбор telemetry и доступ к метрикам по [observability](../operations/observability.md).

## Проверка перед публикацией

Используйте [матрицу тестирования](../testing/testing.md) и
[deployment checklist](../operations/deployment.md). Для адаптации маршрутов выполните как минимум
formatter check, lint, TypeScript, свежий production build и E2E. Если используется Docker,
отдельно проверьте image build и запуск контейнера. Проверка локального Next.js не заменяет их.

После изменения общих компонентов и темы проверьте согласованность COMPONENTS.md,
DESIGN.md, stories и соответствующей страницы OpenWiki. После добавления рабочего
сценария обновите [навигацию](../quickstart.md), чтобы его можно было найти по задаче.
