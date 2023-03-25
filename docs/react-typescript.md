# TS & React

Typescript - это язык программирования, который является типизированным надмножеством языка JavaScript. Он добавляет статическую типизацию, абстрактные классы, интерфейсы и другие возможности, которых нет в обычном JavaScript. Typescript является нашим стандартом для разработки любых приложений. Мы подключаем его на все новые и крупные проекты.

### Пример использования Typescript с React

Мы используем function declaration, с типизацией пропсов через type

Ниже приведен пример стандартного компонента React, написанного на Typescript:

```ts
import React from 'react';

type GreetingProps = {
  name: string;
};

function Greeting({ name }: GreetingProps) {
  return <h1>Hello, {name}!</h1>;
}

export default Greeting;

```

### Интерфейсы и типы

В Typescript есть два основных способа определения типов: интерфейсы и типы. Они оба используются для определения типов данных, но имеют несколько отличий.

Определение интерфейса и типа выглядит очень похоже. Разница заключается в том, что интерфейсы могут быть расширены через оператор "extends", а типы могут быть объединены через оператор "&".

```ts
interface Animal {
  type: string
}

interface Dog extends Animal {
  bark: () => void
}

type Cat = Animal & {
  meow: () => void
}

```

Также присутствует существенная разница при расширении интерфейсов и типов:

Интерфейсы:
```ts
interface Window {
  title: string
}

interface Window {
  ts: TypeScriptAPI
}

const src = 'const a = "Hello World"';
window.ts.transpileModule(src, {});
```

Типы: 
```ts
type Window = {
  title: string
}

type Window = {
  ts: TypeScriptAPI
}

 // Error: Duplicate identifier 'Window'.
```

## Так что же в итоге использовать?
- всегда используйте **типы** для типизации React компонентов (props, state, refs, context), либо общих типов или функций.
- используйте **интерфейсы** при создании **своей библиотеки**, или **патчинга** типизации **3rd party** библиотеки, а также для определения **классов** и **абстракций**, так как это больше подходит по стилю ООП

### Функциональные компоненты

Есть два основных способа определения функциональных компонентов: через функциональное объявление и через функциональное выражение.

Функциональное объявление выглядит следующим образом (наш выбор):

```tsx
function MyComponent(props: MyComponentProps) {
  return <div>{props.name}</div>;
}
```

Функциональное выражение выглядит следующим образом:

```tsx
const MyComponent: React.FC<MyComponentProps> = (props) => {
  return <div>{props.name}</div>;
};
```

## Имена компонентов в devtools
Основное отличие между ними заключается в том, что функциональное объявление предоставляет имя компонента автоматически, и отображает его в девтулах при использовании с HOC (пример - observer от MobX), в то время как функциональное выражение требует **дополнительного** явного указания имени компонента, которое не всегда срабатывает.

## Generics situation

Также мы предпочитаем функциональное объявление ввиду простого синтаксиса дженериков, и для избежания ситуации return в одну строку в стрелочных функциях по умолчанию

Пример function declaration
```typescript
function GenericDeclaration<T extends Record<string, number | string>>(props: Prop<T>) {
    return (
        <div>
            Example Prop id: {props.example.id}, Example Prop name: {props.example.name}
        </div>
    );
}
```

Пример function expression. ```React.FC, React.VFC - теперь deprecated```
```typescript
const GenericExpression: <T extends Record<string, number | string>>(
    props: Prop<T>
) => JSX.Element = <T extends Record<string, unknown>>(props: Prop<T>): JSX.Element => (
    <div>
        Example Prop id: {props.example.id}, Example Prop name: {props.example.name}
    </div>
);

```

## forwardRefs situation

В сборке используется патч для **типизации** кейса с пробросом рефов в react.augment.d.ts 

пример:

```tsx
function Component(
    props: ComponentProps,
    ref: ForwardedRef<HTMLDivElement> // ForwardedRef есть по умолчанию глобально
) {
  return <>...</>
}

export default forwardRef(Component)
```

## any 

Не стоит избегать прописывания типов, это сократит количество возможных багов еще на этапе анализа кода. 
Тем более, наш линтер пропустит explicit-any оставив это как warning, это допускается в редких кейсах при типизации сложных 3rd party пакетов, которые не имеют у себя внутри адекватную типизацию.    

В остальных кейсах, типизация необходима. Это послужит заменой документации для остальных коллег по проекту.

Не допускаются комменты (техдолг):
```typescript
/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */
/* @ts-ignore */
```

Если срочно нужен коммит недоработаной фичи, закрытой фича-флагами, лучше добавить все свое проблемное дерево компонентов в .eslintignore + tsconfig.excludes. 
Затем итерациями исправляем свои компоненты, постепенно убирая вложенность в исключениях линтера и ts 

Возможные решения:
- остановитесь на пару минут и прочитайте подробнее об ошибке, возможно все не так плохо, как кажется
- иногда ts сам приведет возвращаемое значение к нужному типу (infer)
- используйте unknown
- используйте приведение типов (as)
- используйте дженерики
- позовите старшего коллегу на помощь

Не забывайте о том, что использование `any` приведет также и к отключению ts типизации в коде коллег, использующих ваш функционал.

## Шпаргалка по множествам типов
![Шпаргалка](https://hsto.org/r/w1560/getpro/habr/upload_files/459/3b6/922/4593b6922416e8a49097317e82e88552.png)


## @ts-reset 
В проекте подключена библиотека ts-reset, которая фиксит проблемы ts, по аналогии с css reset
- .json (в fetch) и JSON.parse возвращают unknown, а не any
- .filter(Boolean) вернет то что вы ожидаете
- расширенный тип для array.includes
- и еще будет дополняться