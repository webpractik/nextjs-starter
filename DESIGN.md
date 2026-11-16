---
version: alpha
name: Next.js Starter
description: Нейтральная основа интерфейса со светлой палитрой slate и шрифтом Geist Sans.
colors:
    background: hsl(0 0% 100%)
    foreground: hsl(222.2 84% 4.9%)
    primary: hsl(222.2 47.4% 11.2%)
    primary-foreground: hsl(210 40% 98%)
    secondary: hsl(210 40% 96.1%)
    secondary-foreground: hsl(222.2 47.4% 11.2%)
    muted: hsl(210 40% 96.1%)
    muted-foreground: hsl(215.4 16.3% 46.9%)
typography:
    sans:
        fontFamily: Geist Sans
    h1:
        fontSize: 1.875rem
        fontWeight: 700
        lineHeight: 1.25
    h2:
        fontSize: 1.5rem
        fontWeight: 600
        lineHeight: 1.25
    h3:
        fontSize: 1.25rem
        fontWeight: 600
        lineHeight: 1.25
    h4:
        fontSize: 1.25rem
        fontWeight: 500
        lineHeight: 1.25
    h5:
        fontSize: 1.125rem
        fontWeight: 500
        lineHeight: 1.25
    h6:
        fontSize: 1rem
        fontWeight: 500
        lineHeight: 1.25
    p:
        fontSize: 1rem
        fontWeight: 400
        lineHeight: 1.25
rounded:
    base: 0.5rem
    sm: 0.25rem
    md: 0.375rem
    lg: 0.5rem
spacing:
    base: 0.25rem
components:
    button-default:
        backgroundColor: '{colors.primary}'
        textColor: '{colors.primary-foreground}'
        rounded: '{rounded.md}'
        height: 2.25rem
    button-secondary:
        backgroundColor: '{colors.secondary}'
        textColor: '{colors.secondary-foreground}'
        rounded: '{rounded.md}'
    button-outline:
        backgroundColor: '{colors.background}'
        rounded: '{rounded.md}'
    button-outline-hover:
        backgroundColor: '{colors.muted}'
        textColor: '{colors.foreground}'
    field-description:
        textColor: '{colors.muted-foreground}'
    input:
        backgroundColor: transparent
        rounded: '{rounded.md}'
        height: 2.25rem
---

## Overview

Это стартовый шаблон для русскоязычных приложений. Базовое оформление использует нейтральную
палитру slate, локальный Geist Sans и компоненты Base UI в стиле shadcn base-vega.

## Colors

Для поверхностей, текста и действий используйте семантические роли общей темы. Основные действия
оформляйте вариантом кнопки default, второстепенные действия — secondary, outline или ghost.
Ошибки полей и опасные действия используют роль destructive и готовые состояния компонентов.

## Typography

Для заголовков и текста используйте варианты Typography с общей гарнитурой sans. Сохраняйте
семантику заголовков независимо от выбранного визуального размера.

## Layout

Отступы задавайте стандартной шкалой Tailwind. Для общей ширины контента используйте существующий
container; размеры и промежутки внутри reusable UI берите из его вариантов.

## Elevation & Depth

Для группировки контента используйте готовые Card с тонким контуром и лёгкой тенью. Модальные
окна оформляйте компонентом Dialog вместе с его overlay.

## Shapes

Кнопки и поля используют общий радиус md. Карточки и диалоги сохраняют собственный радиус xl
из стандартной темы Tailwind.

## Components

Выбирайте готовые UI-компоненты и их варианты по карте компонентов. Для иконок используйте
Lucide; подписи и ошибки полей размещайте через общие компоненты форм.

Сохраняйте видимый фокус клавиатуры, accessible names и состояния disabled и invalid при
изменении оформления интерактивных элементов.

При `prefers-reduced-motion: reduce` Hero сразу показывает конечное состояние без размытия,
перемещения и задержки, включая серверную разметку до загрузки JavaScript.

## Do's and Don'ts

- Применяйте светлую общую тему к новым экранам. Отдельное чёрное оформление Hero относится
  только к стартовой странице; Hero использует h-dvh и однотонный текст neutral-100; глобальная тёмная палитра в шаблоне не задана.
- Переиспользуйте Base UI, сохраняя accessibility semantics и props. Не заменяйте Base UI
  на Radix без отдельного требования.
