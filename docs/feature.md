## Работа с feature flag

Для работы с фиче флагами используется пакет [Unleash](https://docs.getunleash.io) и его [SDK для NextJS](https://docs.getunleash.io/reference/sdks/next-js)
и [Gitlab Feature Flags](https://docs.gitlab.com/ee/operations/feature_flags.html)

## Переменные

`env` - файл должен содержать следующие переменные:

| Переменная                   | Описание                                                                | Где брать                                                                                                                                                                                                                   | Пример                                                     |
| ---------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `UNLEASH_SERVER_API_URL`     | `API URL` запроса флагов из `Gitlab`                                    | В `Gitlab` в нужном проекте - `Deploy` -> `Feature flags`.<br/>Справа вверху кнопка `Configure` -> Поле `API URL`.                                                                                                          | `https://gitlab.com/api/v4/feature_flags/unleash/11111111` |
| `UNLEASH_SERVER_INSTANCE_ID` | `Instance ID` для авторизации                                           | В `Gitlab` в нужном проекте - `Deploy` -> `Feature flags`.<br/>Справа вверху кнопка `Configure` -> Поле `Instance ID`.                                                                                                      | `bPQzIE02k9PmS2PkXKS2`                                     |
| `UNLEASH_APP_NAME`           | Название окружения.<br/>Значение фиче флага будет запрашиваться по нему | Это названия веток.<br/>Так же можно увидеть зайдя `Gitlab` в нужном проекте - `Deploy` -> `Feature flags`.<br/> Далее создаем новый флаг или меняем существующий и в поле `Environments` будут варианты значений окружения | `local`, `work`, `rc`, `production`                        |

## Использование

## Серверные компоненты

Использовать функцию `flag` с названием нужного флага, возвращает `boolean` значение

```jsx
const isEnabled = await flag('epgu');
```

```jsx
export default async function HomePage() {
    const isEnabled = await flag('epgu');
    return (
        <div className="flex flex-col items-center justify-center gap-6">
            <div>
                Feature epgu toggle is: <strong>{isEnabled ? 'ENABLED' : 'DISABLED'}</strong>
            </div>
        </div>
    );
}
```

## Клиентские компоненты

### Предусловия

1. Должна быть заведена [ручка](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) которая будет проксировать запрос с клиента на `Gitlab`

```ts
export async function GET() {
    try {
        const definitions = await getDefinitions({
            fetchOptions: {
                next: { revalidate: 15 },
            },
        });

        return NextResponse.json(evaluateFlags(definitions));
    } catch (error) {
        return NextResponse.json({
            status: 500,
            statusText: error,
        });
    }
}
```

2. Нужен кастомный провайдер который будет содержать `FlagProvider` от `Unleash`

В кастомный провайдер необходимо передать URL созданной в 1 шаге ручки, например, `/api/feature-flag`

```tsx
export const FeatureFlagProvider = ({ children }: { children: ReactNode }) => {
    return (
        <FlagProvider
            config={{
                url: `${environment.NEXT_PUBLIC_FRONT_URL}/api/feature-flag`,
            }}
        >
            {children}
        </FlagProvider>
    );
};
```

3. Далее оборачиваем потребителей фичи в созданный провайдер

```tsx
export default function FeaturePage() {
    return (
        <FeatureFlagProvider>
            <SomeComponent />
        </FeatureFlagProvider>
    );
}
```

В компоненте можем использовать хуки для получения значений фиче-флагов

| Хук                      | Описание                                                        | Пример ответа                                                     |
| ------------------------ | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| `useFlag('flagName') `   | Хук для получения значения флага                                | `true`                                                            |
| `useVariant('flagName')` | Возвращает варианты флага                                       | `{ enabled : true, feature_enabled : true, name : "newVariant" }` |
| `useFlagsStatus()`       | Возвращает состояние флагов, грузятся ли сейчас, есть ли ошибки | `{ flagsReady : true, flagsError : null }`                        |

```tsx
export default function Feature() {
    const isEnabled = useFlag('flagName');
    const variant = useVariant('flagName');
    const { flagsReady } = useFlagsStatus();

    if (!flagsReady) {
        return (
            <div role="status">
                <svg
                    aria-hidden="true"
                    className="size-8 animate-spin fill-blue-600 text-gray-200 dark:text-gray-600"
                    viewBox="0 0 100 101"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                        fill="currentColor"
                    />
                    <path
                        d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                        fill="currentFill"
                    />
                </svg>
                <span className="sr-only">Loading...</span>
            </div>
        );
    }

    return (
        <>
            Feature {flag} toggle is: <strong>{isEnabled ? 'ENABLED' : 'DISABLED'}</strong>
            <br />
            Variant: <pre>{JSON.stringify(variant, null, 2)}</pre>
        </>
    );
}
```
