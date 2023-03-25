# Error Boundaries
React Error Boundaries - это компоненты высшего порядка, которые позволяют обрабатывать ошибки компонентов в React. Они могут быть использованы для отлавливания ошибок во время рендеринга, в методах жизненного цикла и даже в обработчиках событий.

React Error Boundaries предназначены для того, чтобы предотвратить краш всего приложения при возникновении ошибок в компонентах. Они позволяют отловить ошибку в компоненте и предоставить пользователю информацию о том, что что-то пошло не так, а затем продолжить работу приложения.

# Обратите внимание!
**Как минимум** весь блок контента страницы в каркасе должен быть обернут в Boundary. Юзер не должен видеть полностью упавшую белую страницу с ошибкой. Для него должна оставаться возможность пользоваться навигацией и переходить на другие рабочие страницы. Также не забываем оборачивать все сложные компоненты, которые потенциально могут упасть с ошибкой и повредить видимость остального контента.

В nextjs 13 app directory (beta) error boundaries встроены в экосистему и ловят также ошибки на серверной стороне.

Для использования React Error Boundaries в вашем приложении вы можете использовать компонент `Boundary` из `nextjs-starter`. Наш компонент использует @sentry/react, для отправки трассировки ошибки в sentry:

```tsx
type ErrorFallbackProps = {
    error: { message: string };
    resetError: () => void;
};

function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
    return (
        <div className={cn.errorWrapper} role="alert">
            <div className={cn.errorLabel}>Что-то пошло не так:</div>

            <pre className={cn.errorText}>{error.message}</pre>

            <button type="button" onClick={resetError}>
                Попробовать еще
            </button>
        </div>
    );
}

function Boundary({ children, fallback, onError, onReset }: ErrorBoundaryProps) {
    return (
        <ErrorBoundary fallback={fallback ?? ErrorFallback} onError={onError} onReset={onReset}>
            {children}
        </ErrorBoundary>
    );
}

export default Boundary;
```

Стоит отметить, что error boundary ловит только ошибки, возникшие синхронным образом. Это относится к ошибкам в обработчиках, ошибки рендера компонентов, и тд.

Для того, чтобы поймать ошибки, возникшие в асинхронщине `react-query` у вас есть 2 способа:

### Способ 1

```tsx
import { useMyQuery } from '@/queries/myQuery';

const MyComponent = () => {
  const myQuery = useMyQuery({
      useErrorBoundary: true,
  });

	...
};
```

Этот флаг по умолчанию прокинет любую возникшую ошибку в ближайший родительский `Boundary`

Также можно фильтровать отлавливаемые ошибки подобным образом:

```tsx
const myQuery = useMyQuery({
      useErrorBoundary: (error) => error.response?.status >= 500,
});
```

### Способ 2

Необходимо использовать коллбеки `onError` и `onSettled` , которые будут вызываться при возникновении ошибок или завершении запроса со статусом `fulfilled/rejected`.

Для передачи ошибок в нашу обертку `Boundary` мы можем использовать состояние компонента. В случае возникновения ошибки в `react-query`, мы можем установить состояние компонента в соответствующее значение, и затем обработать ошибку внутри `ErrorBoundary`.

Вот пример того, как это может быть реализовано:

```tsx
import { useMyQuery } from '@/queries/myQuery';

const MyComponent = () => {
  const [hasError, setHasError] = useState(false);

  const { isLoading, isError, data, error } = useMyQuery(
    {
      onError: () => {
        setHasError(true);
      },
      onSettled: () => {
        setHasError(false);
      },
    }
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError || hasError) {
    throw error || new Error('Ошибка в компоненте');
  }

  return <div>{data}</div>;
};
```

В этом примере мы используем `useState` для отслеживания наличия ошибок. В функции `onError` мы устанавливаем флаг `hasError` в значение `true`, а в функции `onSettled` - в значение `false`. Затем мы проверяем, есть ли ошибка в `react-query` или ошибка в нашем компоненте. Если есть, мы бросаем ошибку, которая будет перехвачена `Boundary`.

Например, в `fallback` вашей обертки `Boundary` вы можете отобразить пользователю сообщение об ошибке:

```tsx
const MyParentComponent = () => {
  return (
    <Boundary
      onReset={() => {
        // Логика для перезагрузки компонента после ошибки
      }}
      fallback={({ error }) => {
        return <div>Произошла ошибка: {error.message}</div>;
      }}
    >
      <MyComponent />
    </ErrorBoundary>
  );
};

```