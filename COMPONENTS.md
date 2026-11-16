# Карта компонентов

Источник истины — `src/components/`. Перед добавлением UI проверьте эту карту и соседние stories.
Обновляйте карту при добавлении, переносе или удалении компонента. Route-local UI находится в
`app/.../_components/` и в эту карту не входит.

## UI-примитивы

Импортируйте из `#/components/ui/<каталог>` через публичный `index.ts` или `index.tsx`.
Не импортируйте внутренние файлы компонента. `cn` доступен из `#/components/ui/cn`.

| Каталог                                             | Назначение                                                      |
| --------------------------------------------------- | --------------------------------------------------------------- |
| [attachment](src/components/ui/attachment/)         | Загрузка файлов, состояния вложений и предпросмотр изображений. |
| [badge](src/components/ui/badge/)                   | Статусные метки.                                                |
| [button](src/components/ui/button/)                 | Кнопка и варианты оформления.                                   |
| [card](src/components/ui/card/)                     | Карточка с заголовком, содержимым и нижней частью.              |
| [checkbox](src/components/ui/checkbox/)             | Флажок.                                                         |
| [dialog](src/components/ui/dialog/)                 | Модальное окно.                                                 |
| [field](src/components/ui/field/)                   | Подписи, описания и ошибки полей.                               |
| [form](src/components/ui/form/)                     | Типизированные формы TanStack Form и поля.                      |
| [input](src/components/ui/input/)                   | Однострочный ввод.                                              |
| [label](src/components/ui/label/)                   | Подпись элемента формы.                                         |
| [radio-group](src/components/ui/radio-group/)       | Выбор одного значения.                                          |
| [sanitized-html](src/components/ui/sanitized-html/) | Безопасный вывод HTML с очисткой.                               |
| [select](src/components/ui/select/)                 | Выпадающий выбор.                                               |
| [separator](src/components/ui/separator/)           | Разделитель.                                                    |
| [skeleton](src/components/ui/skeleton/)             | Состояние загрузки.                                             |
| [slider](src/components/ui/slider/)                 | Выбор значения на шкале.                                        |
| [switch](src/components/ui/switch/)                 | Переключатель.                                                  |
| [tabs](src/components/ui/tabs/)                     | Вкладки.                                                        |
| [textarea](src/components/ui/textarea/)             | Многострочный ввод.                                             |
| [toast](src/components/ui/toast/)                   | Уведомления и менеджер уведомлений.                             |
| [tooltip](src/components/ui/tooltip/)               | Подсказки.                                                      |
| [typography](src/components/ui/typography/)         | Типографика и её варианты.                                      |

## Формы

Общий API — `#/components/ui/form`: `useAppForm`, `withForm`, `withFieldGroup`, `extendForm`,
`formOptions`, контексты и `SubmitButton`. Поля регистрируются в `form.AppField`, компоненты формы
рендерятся внутри `form.AppForm`.

| Поля                                            | Каталоги внутри `ui/form/fields/`                   |
| ----------------------------------------------- | --------------------------------------------------- |
| `TextField`, `TextareaField`                    | `text-field`, `textarea-field`                      |
| `NumberField`, `DateField`, `PhoneField`        | `number-field`, `date-field`, `phone-field`         |
| `CheckboxField`, `SwitchField`                  | `checkbox-field`, `switch-field`                    |
| `SelectField`, `RadioGroupField`, `SliderField` | `select-field`, `radio-group-field`, `slider-field` |

`ui/form/fields/shared` содержит внутреннюю композицию поля и ошибок. Пример формы и правила
очистки HTML приведены в [справочнике UI](openwiki/ui/core.md).

## Providers и utilities

| Публичный путь                                                                       | Назначение                                              |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------- |
| [providers/query-provider](src/components/providers/query-provider/)                 | Провайдер TanStack Query.                               |
| [providers/form-devtools-provider](src/components/providers/form-devtools-provider/) | Инструменты диагностики форм в development.             |
| [utilities/error-boundary](src/components/utilities/error-boundary/)                 | Граница ошибок React.                                   |
| [utilities/responsive](src/components/utilities/responsive.tsx)                      | `Desktop`, `Laptop`, `Mobile`, `Tablet` по media query. |

Providers не содержат бизнес-сущностей. Для доменных providers используйте соответствующий
модуль; правила размещения — в [архитектуре](openwiki/architecture/overview.md).
