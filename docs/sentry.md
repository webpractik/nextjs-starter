## Подключение Sentry на проект

 - Заходим на [sentry.w6p.ru](https://sentry.w6p.ru/organizations/webpractik/projects/)

 - Создаем новый проект, обязательно указываем платформу NEXT.JS

 - В настройках проекта ищем DSN ключ ```SDK SETUP => Client Keys (DSN)```

 - Этот ключ задаем в .env переменной SENTRY_DSN 

 - Ищем auth token в настройках webpractik (запросить доступ у старшего)
 
 - Прописываем его в auth.token, в файле [sentry.properties](../sentry.properties)
 
 - В .env переменную APP_ENV просим dev-ops в CI прописывать название stage при деплое

