# Cache Components и streaming

> Тип: объяснение + правила · Статус: включено · Источник истины: `next.config.ts`, generated cache
> tags и официальная документация Next.js

В `next.config.ts` включён `cacheComponents: true` — опциональный режим Next.js 16, объединяющий
Cache Components, Partial Prerendering и динамический I/O. Провайдер TanStack Query сохранён:
серверный кеш и управление серверными данными в клиенте можно использовать вместе.

## Выбор data layer

| Сценарий                                   | Предпочтительный старт                          |
| ------------------------------------------ | ----------------------------------------------- |
| Данные нужны только для server-rendered UI | Async Server Component                          |
| Общие данные выгодно переиспользовать      | `'use cache'` + `cacheLife`/`cacheTag`          |
| Request-specific данные                    | Dynamic Server Component внутри `<Suspense>`    |
| Client polling/realtime/частые refetch     | Generated TanStack Query hook                   |
| Сложный optimistic client workflow         | React Query mutation или Server Action по месту |
| Мутация формы с server authorization       | Server Action с повторной auth/validation       |

Не переносите загрузку в клиент ради React Query и не удаляйте интерактивный клиентский кеш
ради Cache Components.

## Streaming

Асинхронные Server Components можно разделять границами Suspense. `loading.tsx` задаёт заглушку
для сегмента, локальный `<Suspense>` позволяет выводить блоки независимо, по мере готовности.

```tsx
import { Suspense } from 'react'

export default function PetPage() {
    return (
        <Suspense fallback={<PetSkeleton />}>
            <PetDetails />
        </Suspense>
    )
}
```

Запускайте независимые промисы до первого `await` или в соседних
асинхронных компонентах. Сохраняйте примерный размер блока в заглушке, чтобы уменьшить сдвиг макета.

Ошибки рендеринга маршрута обрабатывает ближайший `error.tsx`, последняя граница — `global-error.tsx`.
Sentry `ErrorBoundary` полезна в клиентском поддереве, но не заменяет обработку ошибок сегмента
и не ловит произвольные ошибки событийных обработчиков.

## `'use cache'`

Директива применяется к асинхронной функции, компоненту или файлу. Сериализуемые аргументы и
захваченные значения входят в ключ кеша.

```tsx
import { getPetById } from '@repo/api/codegen/clients/petsController/getPetById'
import { pets } from '@repo/api/codegen/tags'
import { cacheLife, cacheTag } from 'next/cache'

export async function loadPet(petId: string) {
    'use cache'
    cacheLife('minutes')
    cacheTag(pets.petsTag, pets.petTag({ petId }))

    return getPetById({ petId })
}
```

Правила:

- выбирайте срок кеширования по допустимой давности данных;
- оценивайте число комбинаций аргументов: каждая создаёт отдельный ключ;
- не используйте секреты и токены сессии в ключах общего кеша;
- не помещайте персонализированный результат в общий кеш ради производительности;
- измеряйте долю попаданий и память, особенно на собственной инфраструктуре с несколькими репликами.

`cacheLife` работает только в области кеширования. Профили и значения могут меняться между версиями
Next.js — проверяйте не старые руководства, а
[актуальный справочник API](https://nextjs.org/docs/app/api-reference/functions/cacheLife).

## Runtime APIs и `'use cache: private'`

Обычный `'use cache'` не читает напрямую `cookies()`, `headers()` и `searchParams`. Читайте их
снаружи и передавайте минимум безопасных данных аргументом либо оставьте компонент динамическим.

`'use cache: private'` экспериментальна. В актуальном Next.js она выполняется при каждом серверном
рендеринге, кешируя результат лишь в памяти браузера до перезагрузки.
API запроса разрешены, Route Handlers не поддерживаются. Это не «приватный server cache на пользователя»;
не включайте директиву по умолчанию в production.

Перед применением проверьте версию Next.js и
[официальное описание](https://nextjs.org/docs/app/api-reference/directives/use-cache-private).

## Cache tags

Локальный плагин Kubb генерирует пространство имён по тегу OpenAPI. Текущий контракт создаёт:

```ts
import { pets } from '@repo/api/codegen/tags'

pets.petsTag // 'pets'
pets.petTag({ petId: 'pet_123' }) // 'pets:petId:pet_123'
```

Используйте эти функции при чтении и записи: строковые литералы могут разойтись после изменения
параметров контракта.

### `updateTag` и `revalidateTag`

| API                              | Где разрешён                    | Семантика                                  |
| -------------------------------- | ------------------------------- | ------------------------------------------ |
| `updateTag(tag)`                 | Только Server Action            | Немедленное expire для read-your-writes    |
| `revalidateTag(tag, 'max')`      | Server Function и Route Handler | Stale-while-revalidate при следующем visit |
| `revalidateTag(tag)` без profile | Не использовать                 | Deprecated blocking behavior               |

Сгенерированные `pets.revalidatePet()` и `pets.revalidatePets()` вызывают `updateTag`:
несмотря на имя `revalidate*`, они разрешены только в Server Action.

```ts
'use server'

import { updatePet } from '@repo/api/codegen/clients/petsController/updatePet'
import { pets } from '@repo/api/codegen/tags'

export async function markPetSold(petId: string) {
    // Повторно проверьте authentication, authorization и входные данные здесь.
    await updatePet({ petId, data: { status: 'sold' } })
    await pets.revalidatePet({ petId })
    await pets.revalidatePets()
}
```

В webhook/Route Handler вызывайте `revalidateTag(pets.petsTag, 'max')` напрямую: сгенерированная
обёртка над `updateTag` вызовет ошибку выполнения.

Server Actions — публичные обработчики мутаций, доступные по сети. Проверяйте аутентификацию и
права внутри каждой, даже если кнопка скрыта.

## React Query остаётся поддержанным

Корневой layout подключает `QueryProvider` и `ReactQueryStreamedHydration`. Сгенерированные хуки
подходят для данных, нужных только клиенту, опроса, обновлений по событиям в реальном времени и сложных
оптимистичных обновлений.

```tsx
'use client'

import { useGetPetById } from '@repo/api/codegen/hooks/petsController/useGetPetById'

export function PetStatus({ petId }: { petId: string }) {
    const query = useGetPetById({ petId })
    return <span>{query.data?.status}</span>
}
```

Не дублируйте в кеше Query полностью отрендеренные данные Server Component без необходимости,
если клиент не перезапрашивает их.

## Self-hosting и несколько replicas

Кеш по умолчанию хранится в памяти процесса: у реплик standalone/Docker он свой и очищается перезапуском.
Общий бэкенд `cacheHandlers` не настроен; согласованность реплик требует проектирования общего кеша.

## Чеклист

1. Определите, нужны ли данные клиенту после гидратации.
2. Добавьте подходящую заглушку Suspense/loading для динамического блока.
3. Для `'use cache'` задайте срок хранения, проверьте число ключей и наличие чувствительных данных.
4. Используйте сгенерированные теги при чтении и записи.
5. `updateTag` вызывайте только из Server Action; для Route Handler используйте
   `revalidateTag(tag, 'max')`.
6. Проверяйте аутентификацию, права и входные данные внутри каждой Server Action.
7. Тестируйте production-сборку: кеширование и потоковый рендеринг в разработке отличаются.
8. Для нескольких реплик отдельно решите вопрос общего кеша и инвалидации.

## Официальные источники

- [Cache Components](https://nextjs.org/docs/app/api-reference/config/next-config-js/cacheComponents)
- [`use cache`](https://nextjs.org/docs/app/api-reference/directives/use-cache)
- [`use cache: private`](https://nextjs.org/docs/app/api-reference/directives/use-cache-private)
- [`cacheLife`](https://nextjs.org/docs/app/api-reference/functions/cacheLife)
- [`updateTag`](https://nextjs.org/docs/app/api-reference/functions/updateTag)
- [`revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- [Mutating data and Server Actions](https://nextjs.org/docs/app/getting-started/mutating-data)
