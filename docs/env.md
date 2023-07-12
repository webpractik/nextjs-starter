### ENV переменные
Глобальные переменные:
```
FRONT_HOST - хост в локальной сети kubernetes 
FRONT_PORT - порт
BACK_INTERNAL_URL - полный путь для обращения к backend приложению (http://back:80)

HTTP_AUTH_LOGIN=demo
HTTP_AUTH_PASS=demo
```
Переменные, которые должны быть доступны на момент сборки:
```
NEXT_PUBLIC_MOCKS_ENABLED=false - режим моков

NEXT_PUBLIC_APP_ENV - LOCAL | WORK | RC | PROD
NEXT_PUBLIC_FRONT_URL - публичный урл front приложения
NEXT_PUBLIC_BACK_URL - публичный урл back приложения (опционален)
NEXT_PUBLIC_SENTRY_DSN - DSN для доступа к Sentry
NEXT_PUBLIC_FRONT_PROXY - точка входа в BFF слой для проксирования запросов
```
Для валидации ENV переменных добавлены плагины [t3-env](https://env.t3.gg/docs/nextjs) и [zod](https://zod.dev/)

Если какая-то из обязательных переменных отсутствует или не в том формате сборка упадет с ошибкой с указанием env переменной

Файл с валидацией переменных находится в корне проекта

```
env.mjs
```

Пример использование переменных как на клиенте так и на стороне сервера:

Импорт env из файла в корне
```
import { env } from '~/env.mjs';
```
Пример обращения к переменной окружения
```
env.SENTRY_DSN
```