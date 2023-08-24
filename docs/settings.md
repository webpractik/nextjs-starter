# Настройка husky

### Кастомизация путей

Если фронт приложение не находится в корне проекта, а например, во вложении `apps/front`, тогда для корректной работы гит-хуков нужно отредактировать скрипт `prepare` в package.json таким образом:

1.

```json
{
    "scripts": {
        "prepare": "cd ../.. && husky install apps/front/.husky"
    }
}
```

2.

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged --cwd apps/front
```

# Настройки в PHPStorm

## eslint:

ESLint должен подключиться автоматически, но в случае если это не произошло, заходим в
`File | Settings | Languages & Frameworks | JavaScript | Code Quality Tools | ESLint`

Выбираем Manual Eslint Configuration:

    Node Interpreter: Project Node
    ESlint Package: указаываем путь к package json
    Configuration file: указываем путь к .eslintrc

Ставим галочку

-   [ ] `Run eslint --fix on save`

## prettier:

-   Переходим в `File | Settings | Languages & Frameworks | JavaScript | Prettier`
-   Выбираем путь к нужным node_modules в Prettier package
-   Ставим галочку
-   [ ] `Run on save`

## stylelint:

-   Переходим в `File | Settings | Languages & Frameworks | Style Sheets | Stylelint`
-   Ставим галочку
-   [ ] `Enable`
-   Убеждаемся, что стоит правильный путь к пакету из node_modules
-   `Run for files`: изменить на `{**/*,*}.{css, sass}`
