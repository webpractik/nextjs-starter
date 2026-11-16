---
type: "Справочник"
title: "Предзагрузка ссылок через ForesightJS"
openwiki_generated: true
generated: { by: "codex", at: "2026-11-16T15:55:30.306Z" }
---

# Предзагрузка ссылок через ForesightJS

Для внутренних переходов по умолчанию используйте `ForesightLink` из
`#/components/utilities/foresight-link`. Компонент сохраняет Next.js Link и typed routes,
но отключает его автоматический prefetch. Когда ForesightJS определяет намерение пользователя,
компонент вызывает `router.prefetch(href)`. Кешированием и переходом управляет Next.js.

```tsx
import { ForesightLink } from '#/components/utilities/foresight-link'

export function Navigation() {
    return <ForesightLink href="/">На главную</ForesightLink>
}
```

Компонент принимает строковый `href`, включая query-параметры, и props ссылки Next.js,
кроме внешнего `ref`. Передавайте `prefetch={false}`, чтобы отключить предзагрузку.
Для внешних URL, якорей, скачивания и другого `target` предзагрузка не запускается.
Для внешних ресурсов используйте обычный `<a>`. Прямые импорты `next/link` и его
реализации запрещены lint вне адаптера `ForesightLink`. Не обходите правило через deep imports.

Зафиксированы точные версии `@foresightjs/react` 1.0.0 и `js.foresight` 4.2.1.
Менеджер создаётся при регистрации первой ссылки. Глобальный provider не нужен.
Библиотека использует настройки по умолчанию. Они включают прогноз движения мыши
и клавиатурной навигации, touch-стратегию `onTouchStart` и ограничения соединения.
В версии 4.2.1 touch-стратегия слушает `pointerdown`.
Viewport сам по себе не запускает prefetch ни на desktop, ни на touch. Прогноз прокрутки
и клавиатурной навигации остаётся частью правил ForesightJS. Регистрацией и очисткой управляет
`useForesight`. Настройки Next.js cacheComponents не меняются.

В стартовой странице пока нет внутренних навигационных ссылок. При добавлении маршрутов
используйте этот компонент. `prefetch={false}` всегда передаётся во внутренний Next.js Link,
поэтому Next.js не предзагружает все ссылки в зоне видимости.
Server Components могут рендерить `ForesightLink`. Клиентская граница находится внутри компонента.

## Проверка

Запустите `npm run test:component -- tests/component/src/components/utilities/foresight-link`.
Тесты проверяют сигнал намерения и отключение предзагрузки в Chromium.
Storybook содержит примеры `utilities/ForesightLink`.

Для повторяемой сетевой проверки выполните `npm run test:e2e:production`.
Команда создаёт временные маршруты из `src/tests/fixtures/foresight`, собирает production,
запускает весь Playwright E2E на standalone-сервере и проверяет desktop и touch:

- Две ссылки видны, но в течение двух секунд запросов к их маршрутам нет.
- Сигнал ForesightJS запускает успешный RSC-запрос к выбранному маршруту до клика.
- `prefetch={false}` блокирует предзагрузку даже при сигнале намерения.
- Клик открывает целевую страницу.

Сетевые данные прикладываются к HTML-отчёту Playwright как `prefetch-network.json`.
После прогона команда удаляет временные маршруты и пересобирает приложение без них.
Не запускайте её одновременно с другой сборкой или dev server в том же checkout.
Production-тесты Foresight пропускаются в обычном dev-прогоне, где prefetch не выполняется.
Режим `PLAYWRIGHT_SERVER_MODE=standalone` запускает `.next/standalone/server.js` и копирует
в standalone необходимые `public` и `.next/static` через `tools/start-standalone.mjs`.

Сетевую предзагрузку проверяйте после свежего `npm run build` на production server.
Запустите его командой `node --env-file-if-exists=.env tools/start-standalone.mjs`.
Откройте Network в браузере. Переместите указатель к внутренней ссылке
или перейдите к ней клавишей Tab. Проверьте RSC-запрос до клика и последующий переход.
В development Next.js не выполняет production-prefetch. Компонентный тест проверяет вызов router.
Предзагрузка может заранее выполнить серверный рендеринг. Размещайте операции с побочными
эффектами в обработчиках действий, а не в render страницы.

Источники: [интеграция ForesightJS с Next.js](https://foresightjs.com/docs/react/nextjs/),
[установка React bindings](https://foresightjs.com/docs/react/installation/).
