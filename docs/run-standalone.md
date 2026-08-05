# Как запустить standalone-сборку локально

> Назначение: проверить production entrypoint без Docker.
>
> Статус: поддерживается вручную и через Playwright E2E.

Next.js создаёт минимальный server благодаря `output: 'standalone'`. Этот сценарий проверяет сам
artifact, но не Docker, ingress или внешний backend.

## Ручной запуск

1. Установите зависимости. Создайте локальный env только в том случае, если его ещё нет:

```bash
npm ci
test -e .env || cp .env.example .env
```

Проверьте значения перед запуском: шаблон содержит только локальные placeholders.

2. Соберите приложение:

```bash
npm run build
```

Команда выполняет `next build`, затем копирует `.next/static` и `public` в `.next/standalone`.
Успешный результат содержит `.next/standalone/server.js`.

3. Запустите server:

```bash
npm run prod
```

Server читает корневой `.env`, если файл существует. `PORT` задаёт порт, `HOSTNAME` — адрес
прослушивания. По умолчанию приложение доступно на
`http://nextjs-starter.127.0.0.1.nip.io:3000`; имя работает через DNS nip.io без изменения
системного `hosts`. `http://localhost:3000` остаётся эквивалентным loopback-адресом.

4. Выполните smoke test:

```bash
curl --fail http://nextjs-starter.127.0.0.1.nip.io:3000/
curl --fail http://nextjs-starter.127.0.0.1.nip.io:3000/api/health
curl --fail http://nextjs-starter.127.0.0.1.nip.io:3000/api/ready
curl --fail http://nextjs-starter.127.0.0.1.nip.io:3000/api/metrics
```

Health и readiness подтверждают только то, что HTTP-процесс отвечает. Они не проверяют backend и
другие зависимости.

## Автоматическая проверка

```bash
npm run test:e2e:standalone
```

Команда сама:

1. создаёт свежую production-сборку;
2. подготавливает standalone assets;
3. запускает Playwright с `PLAYWRIGHT_SERVER_MODE=standalone`;
4. поднимает `npm run prod` и выполняет Chromium E2E.

Обычный локальный `npm run test:e2e` использует development server. При `CI=true` Playwright
выбирает standalone mode, но ожидает уже готовую сборку. Для самодостаточной проверки используйте
`npm run test:e2e:standalone`.

## Переменные окружения

- `NEXT_PUBLIC_*` встраиваются в browser bundle во время build.
- Server values нужны во время build из-за env validation и повторно во время runtime.
- Один готовый artifact нельзя продвигать в окружение с другими public URLs.
- Не включайте реальный `.env` в artifact; передавайте secrets через deployment platform.
- Все реплики одного release должны использовать один и тот же artifact.

Полный список значений находится в [environment.md](environment.md).

## Если запуск не удался

| Симптом                           | Что проверить                                                    |
| --------------------------------- | ---------------------------------------------------------------- |
| Нет `server.js`                   | Запустите `npm run build` и исправьте первую ошибку build        |
| Нет CSS, JS или public assets     | Используйте корневой `npm run build`, а не голый `next build`    |
| E2E обращается не к тому порту    | Задайте одинаковые `FRONT_PORT` и `PORT`                         |
| Порт занят development server     | Остановите его или выберите другой порт                          |
| Assets нужно подготовить отдельно | Запустите `node tools/prepare-standalone.mjs` после `next build` |

## Связанные документы

- [Развёртывание](deployment.md)
- [Release и rollback](release-runbook.md)
- [Self-hosting](self-hosting.md)
- [Правила тестирования](testing-guidelines.md)
