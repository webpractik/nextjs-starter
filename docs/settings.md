## Общие сведения

## Настройка husky 
### Кастомизация путей
Если фронт приложение не находится в корне проекта, а например, во вложении ```apps/front```, тогда для корректной работы гит-хуков нужно отредактировать скрипт ```prepare``` в package.json таким образом:

```json
{
  "scripts": {
    "prepare": "cd ../.. && husky install apps/front/.husky"
  }
}
```

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged --cwd apps/front
```

## Настройка eslint в PHPStorm:
ESLint должен подключиться автоматически, но в случае если это не произошло, заходим в
```File -> Settings -> Languages & Frameworks -> Javascript -> Code Quality Tools -> Eslint```

Выбираем Manual Eslint Configuration:

    Node Interpreter: Project Node
    ESlint Package: указаываем путь к package json
    Configuration file: указываем путь к .eslintrc


## Настройка prettier:
- Переходим в ```File -> Settings -> Languages & Frameworks -> Javascript -> Prettier```
- Выбираем путь к нужным node_modules в Prettier package
- Ставим галочку "On save"
- Готово