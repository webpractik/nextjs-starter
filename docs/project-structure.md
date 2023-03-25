## api
Эта папка содержит весь слой работы с сетевыми запросами, большая часть генерируется на основе OpenAPI
 
- _core_ - базовые классы
- _models_ - содержит dto используемые бекендером, также может переиспользоваться и в вашем коде
- _services_ - классы для взаимодействия с запросами к беку

### clients.ts: 
Содержит все axios инстансы и глобальные интерцепторы
основной интанс - `apiClient`. Он обращается к своему next серверу, которое проксирует на бек все запросы, указанный в env BACK_INTERNAL_URL

[ссылка на статью](./api.md)

### request.ts
Содержит методы для запроса, которые будут использовать все сервисы. Также можно кастомизировать. По умолчанию используется `apiClient`

## Структура компонентов

Корневые домены: 

1. ***core*** - примитивные, низкоуровневые компоненты
2. ***shared*** - общие компоненты для всего приложения
3. ***features*** - фичи для определенных страниц

Правила именования папок:

1. kebab-case - папки с названием домена
2. PascalCase - папки компонентов

## Core 

UI компоненты, либо настроенные обертки над компонентами UI фреймворка (MUI, Mantine UI).
Мельчайшие строительные блоки, в идеале не импортирующие какие-либо другие компоненты проекта. Максимально используются в features/shared компонентах. 
Все core компоненты должны быть вынесены в storybook для удобства команды разработки.

Примеры: кнопка, инпуты, список, табы, тултип, модальное окно, карточка, заголовок и т.д

## Shared 

Более объемные компоненты, которые могут строиться из нескольких core-компонентов. Переиспользуются во всем приложении. Например поля, настроенные для работы с React Hook Form, layout-ы, панели навигации, универсальные фильтры, таблицы. 
Могут быть разбиты по кастомной доменной логике - 

| Домен    |                    Компонент                    |
|----------|:-----------------------------------------------:|
| fields   |   TextField, SelectField, CheckboxField, ....   |
| layouts  |          AdminLayout, NewsLayout, ....          |
| panels   |       ProductPanel, NavigationPanel, ....       |
| modals   |          ConfirmModal, EditModal, ....          |
| user     | UserList, UserCreateForm, <br/>UserAvatar, .... |
| todo     |     TodoList, TodoCreateForm, TodoCard, ...     |
| feedback |        FeedbackForm, FeedbackButton, ...        |

Также есть Shared-утилиты - компоненты, которые визуально ничего не рендерят, но необходимы для переиспользования. Находятся в папке **shared/utilities** 

|           |                  Компонент                  |
|-----------|:-------------------------------------------:|
| utilities | ErrorBoundary, Meta, GoogleAnalytics,  .... |

## Features

Компоненты, которые подключаются только на определенной странице, название директории должно соответствовать названию страницы. Смесь custom, shared и core компонентов, настроенных под конкретную фичу.

Пример исходной структуры:
```
src
├── components
│   ├── core
│   │   └── Card
│   │       └── index.tsx
│   │       └── index.stories.tsx
│   │       └── style.module.sass
│   │   └── Link
│   │       └── index.tsx
│   │       └── index.stories.tsx
│   │       └── style.module.sass
│   │   └── Title
│   │       └── index.tsx
│   │       └── index.stories.tsx
│   │       └── style.module.sass
│   │   └── Tooltip
│   │       └── index.tsx
│   │       └── index.stories.tsx
│   │       └── style.module.sass
│   │   └── Toggle
│   │       └── index.tsx
│   │       └── index.stories.tsx
│   │       └── style.module.sass
│   │   ...
│   │
│   ├── features
│   │   ├── home
│   │   │   └── TodoList
│   │   │       └── index.tsx
│   │   │       └── style.module.sass
│   │   └── todo
│   │       └── CreateForm
│   │           └── index.tsx
│   │           └── style.module.sass
│   │  
│   │  
│   └── shared
│       ├── layouts
│       │   └── MainLayout
│       │       └── index.tsx
│       │       └── style.module.tsx
│       │   ...
│       │   
│       ├── fields                      
│       │   └── TextField
│       │       └── index.tsx
│       │       └── style.module.tsx
│       │   
│       ├── todo
│       │   ├── TodoCard
│       │   │   └── index.tsx
│       │   │   └── style.module.sass
│       │   ├── TodoList
│       │   │   └── index.tsx
│       │   │   └── style.module.sass
│       │   └── CreateForm
│       │       └── index.tsx
│       │  
│       │     
│       └── utilities
│             ├── ErrorBoundary
│             │   └── index.tsx
│             └── NoSSR
│                 └── index.tsx
└── pages
    ├── index.tsx
    └── todo
        └── [id]
            └── index.tsx
```

### Вынесение хуков и чистых функций из компонента

Часто бывает, что в компоненте используется специфичная логика, которую можно разбить по функциям / хукам и вынести из этого компонента. В таком случае, необходимо разбить ее по файлам utils.ts и hooks.ts и положить по соседству.
Основная цель в том, чтобы повысить читаемость кода компонента и выносить в корневые хуки и утилиты только ту логику, которая действительно переиспользуется на проекте.

```
.
├── ...
└── AlbumsCarousel
    ├── AlbumsCarousel.tsx
    └── AlbumsCarousel.utils.ts
    └── AlbumsCarousel.hooks.ts
```

Компонент ДО: 
```typescript jsx
...

export const AlbumsCarousel = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [highlighted, setHighlighted] = useState(null);
  const [zoom, setZoom] = useState(1);
  const albums =  useQuery(['albums'], fetchAlbums());
 
  const modals = useModals();
  const carouselRef = useRef();

  const showLoginModal = () => {
    modals.open(Modals.Login);
  };

  const highlightAlbum = (id: number) => {
    setIsPlaying(false);
    setHighlighted(id);
    carouselRef.current.collapseItems();
  };

  const formatReleaseDate = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timezonedStart = new Date(start.valueOf() + start.getTimezoneOffset() * 60 * 1000);
    const timezonedEnd = new Date(end.valueOf() + end.getTimezoneOffset() * 60 * 1000);

    if (isSameDay(timezonedStart, timezonedEnd)) {
      return `${format(timezonedStart, 'd MMMM yyyy')}`;
    }

    if (!isSameYear(timezonedStart, timezonedEnd)) {
      return `${format(timezonedStart, 'd MMMM yyyy')} ${String.fromCharCode(8212)} ${format(
        timezonedEnd,
        'd MMMM yyyy',
      )}`;
    }

    if (!isSameMonth(timezonedStart, timezonedEnd)) {
      return `${format(timezonedStart, 'd MMMM')} ${String.fromCharCode(8212)} ${format(
        timezonedEnd,
        'd MMMM yyyy',
      )}`;
    }

    return `${format(timezonedStart, 'd')} ${String.fromCharCode(8212)} ${format(
      timezonedEnd,
      'd MMMM yyyy',
    )}`;
  }

  return (
    //...
  )
}
```

Компонент ПОСЛЕ: 
```typescript jsx
...
import { formatReleaseDate } from './utils';
import { useAlbums } from './hooks';

export const AlbumsCarousel = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [highlighted, setHighlighted] = useState(null);
  const [zoom, setZoom] = useState(1);
  
  const albums = useAlbums();

  const modals = useModals();
  const carouselRef = useRef();

  const showLoginModal = () => {
    modals.open(Modals.Login);
  };

  const highlightAlbum = (id: number) => {
    setIsPlaying(false);
    setHighlighted(id);
    carouselRef.current.collapseItems();
  };

  return (
    //...
    //
  )
}
```

## context
Подключаемые контексты вашего приложения, должны содержать в себе
- типизированный контекст
- хук для обращения к вашему контексту, выбрасывающий ошибку в случае, если компонент вызывается вне контекста
- провайдер контекста

Это глобальные контексты, которые не относятся к контекстам compound компонентов

## figma tokens

[ссылка на статью](./figma-tokens.md)

## hooks
Глобальные хуки, переиспользуемые везде в приложении, все чистые - не зависят от контекста и прочего.

перед добавлением нового хука удостоверьтесь, что таких нет в подключенной библиотеке [react-use](https://github.com/streamich/react-use), чтобы не тратить время на написание своих велосипедов и их типизацию

## queries 
[ссылка на статью](./queries.md)

## types 
Глобальные типы для всего проекта, типы для конкретных модулей лучше содержать не здесь, а в области `domain` в нужном модуле

## styles

Содержит все глобальные стили проекта, подключаются в корне приложения

## mocks
[ссылка на статью](./mocks.md)