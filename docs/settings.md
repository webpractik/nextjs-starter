## Общие сведения

## Настройка husky 
Если фронт приложение не находится в корне, а к примеру, в папке ./apps/front, тогда для корректной работы хуков нужно редактировать команду prepare таким образом:
```
{
  "scripts": {
    "prepare": "cd ../.. && husky install apps/front/.husky"
  }
}
```

## Lint staged
На проекте включен запуск нескольких стадий перед коммитом:
- 1 стадия - поправляет ошибки, связанные с линтером
- 2 стадия - форматирует код
- 3 стадия - проверяет валидность ts кода

Далее запускается commitizen - интерактивное меню для создания коммита

## npm scripts: 
- ```npm run dev``` - запуск в режиме разработки (localhost:8080), при повторном запуске чистит порт от предыдущего процесса

- ```npm run build``` - запуск сборки next

- ```npm run start``` - запуск prod сборки

- ```npm run analyze``` - запуск анализатора исходного бандла 

- ```npm run type-check``` - запуск проверки typescript

- ```npm run lint``` - запуск линтера с автофиксингом

- ```npm run format``` - запуск форматирования кода через prettier

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

## Добавление публичных env переменных, доступных в браузере:
- в .env добавляем переменную по примеру ```ENV_EXAMPLE=example```
- далее в next.config.js: ```env: { ENV_EXAMPLE: process.env.ENV_EXAMPLE }```