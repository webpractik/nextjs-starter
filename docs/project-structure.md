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

## Layouts

В новых версиях NextJS добавили (на момент написания доки еще не добавили) поддержку Layouts. Суть - при переходе между страницами сохраняется состояние страницы (вводимые значения, положение прокрутки и т. д.) для работы в режиме SPA. Layout также обеспечит сохранение отрендеренного дерева компонентов. 

```typescript jsx
// pages/index.tsx

import type { ReactElement } from 'react'
import Layout from '@/components/shared/layouts/MainLayout'
import CustomLayout from '@/components/shared/layouts/CustomLayout'
import type { NextPageWithLayout } from './_app'

const Page: NextPageWithLayout = () => {
  return <p>hello world</p>
}

Page.getLayout = function getLayout(page: ReactElement) {
  return (
    <MainLayout>
      {/* дополнительная обертка для конкретной страницы */}
      <NestedLayout>{page}</NestedLayout>
    </MainLayout>
  )
}

export default Page
```
```typescript jsx
// pages/_app.tsx

import type { ReactElement, ReactNode } from 'react'
import type { NextPage } from 'next'
import type { AppProps } from 'next/app'

export type NextPageWithLayout = NextPage & {
  getLayout?: (page: ReactElement) => ReactNode
}

type AppPropsWithLayout = AppProps & {
  Component: NextPageWithLayout
}

export default function MyApp({ Component, pageProps }: AppPropsWithLayout) {
  // Подключать layout страницы, если доступен
  const getLayout = Component.getLayout ?? ((page) => page)

  return getLayout(<Component {...pageProps} />)
}
```

Внутри layout можно получать данные на стороне клиента, используя библиотеку react-query. Поскольку этот файл не является Page, нельзя использовать getStaticProps или getServerSideProps в настоящее время.

```typescript jsx
// components/shared/layouts/MainLayout

export default function MainLayout({ children }) {
  const { data, error } = useQuery(['/api/navigation'], api.fetchNavigation)

  if (error) return <div>Failed to load</div>
  if (!data) return <div>Loading...</div>

  return (
    <>
      <Header links={data.links} />
      <main>{children}</main>
      <Footer />
    </>
  )
}
```