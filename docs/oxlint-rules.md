# Oxlint в проекте

**Когда читать:** когда нужно запустить lint, понять исключение для конкретного файла или найти
источник правила.

Источник истины — [`.oxlintrc.json`](../.oxlintrc.json). Версия Oxlint закреплена в
[`package.json`](../package.json); команды ниже проверены с Oxlint 1.76.0.

## Основные команды

```bash
# Проверить весь проект
npm run lint

# Применить доступные автоматические исправления
npm run lint-fix

# Проверить форматирование, lint и TypeScript
npm run verify:fast

# Проверить один файл
npx oxlint src/env/client.ts
```

После `lint-fix` просмотрите diff: команда меняет файлы, но не запускает formatter или TypeScript.
Для обычной быстрой проверки перед коммитом используйте `npm run verify:fast`.

## Как устроена конфигурация

Конфигурация состоит из двух уровней:

1. `rules` в корне задаёт общие правила для всех проверяемых файлов.
2. `overrides` добавляют плагины и меняют severity или options для подходящих glob-паттернов.

Несколько overrides могут совпасть с одним файлом. Поэтому правило для `*.test.tsx`, например,
складывается из root-настроек, TypeScript, React, Next.js и test override. Эффективную
конфигурацию всегда проверяйте для конкретного пути.

В корне `categories.correctness` выключена. Проект не полагается на меняющийся встроенный набор
правил Oxlint: нужные правила перечислены явно. Глобально подключены native-плагины `import`,
`unicorn`, `jsx-a11y`, JS-плагины для imports, regexp, Tailwind CSS и других проектных соглашений,
а также локальное правило `tools/oxlint/prefer-template-plugin.mjs`.

## Области правил

Таблица объясняет назначение overrides, но не дублирует каждое правило. Точные globs и options
смотрите в `.oxlintrc.json`.

| Область                | Пути                                                                 | Главное отличие от root                                                                                                      |
| ---------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Весь JS/TS             | `**/*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}`                               | Добавлены правила Node.js и JSDoc                                                                                            |
| TypeScript             | `*.ts`, `*.tsx`, `*.mts`, `*.cts`, `*.mtsx`, `*.ctsx`                | Добавлены TypeScript rules; отключены проверки, которые дублирует компилятор; type imports и interfaces проверяются отдельно |
| Тесты и benchmarks     | `__tests__/**`, `*.spec.*`, `*.test.*`, `*.bench.*`, `*.benchmark.*` | Добавлены правила Vitest; разрешены тестовые послабления для top-level await, выражений и static regexp                      |
| React                  | Все JS/TS-файлы                                                      | Добавлены React, RSC, React DOM, Web API и naming rules                                                                      |
| TypeScript + React DOM | Все TypeScript-файлы                                                 | Выключены проверки DOM props, которые конфликтуют с TypeScript                                                               |
| Next.js                | Все JS/TS-файлы                                                      | Добавлены правила `@next/eslint-plugin-next`                                                                                 |
| Кодовые блоки Markdown | Виртуальные JS/TS-пути внутри `*.md`                                 | Ослаблены правила, мешающие коротким примерам; каталог `docs` сейчас исключён через `ignorePatterns`                         |
| Scripts и config       | `**/scripts/**`, `*.config.*`                                        | Разрешены `console` и top-level await; не требуется явный return type                                                        |
| CLI                    | `**/cli/**`, `cli.*`                                                 | Разрешены `console` и top-level await                                                                                        |
| Bin                    | `**/bin/**`, `bin.*`                                                 | Разрешены импорты из `dist` и `node_modules` по пути                                                                         |
| Type declarations      | `*.d.ts`, `*.d.mts`, `*.d.cts`                                       | Ослаблены проверки disable-комментариев и unused vars                                                                        |
| JavaScript/CommonJS    | `*.js`, `*.cjs`                                                      | Разрешён `require`                                                                                                           |
| Stories                | `*.story.*`, `*.stories.*`                                           | Добавлены Storybook rules; разрешён anonymous default export и отключён дублирующий hooks rule                               |
| Storybook config       | `.storybook/main.*`                                                  | Проверяется наличие установленных addons                                                                                     |

`ignorePatterns` исключает generated output, dependencies, coverage, build artifacts, lockfiles,
`packages/api/codegen`, `packages/api/bundled.yaml` и документацию. Перед добавлением нового ignore
убедитесь, что файл действительно нельзя проверять обычными правилами.

## Как найти источник правила

Сначала выведите итоговую конфигурацию для файла:

```bash
npx oxlint --print-config src/env/client.ts
```

Затем найдите правило в source config:

```bash
rg -n '"typescript/consistent-type-imports"' .oxlintrc.json
```

Проверьте root-запись и все overrides, glob которых совпадает с файлом. Если файл вообще не
попадает в lint, команда ниже покажет список выбранных файлов и завершится без проверки:

```bash
npx oxlint --debug=files src/env/client.ts
```

Severity в выводе `--print-config` нормализована: `deny` соответствует `error`, `warn` —
предупреждению, `allow` — выключенному правилу.

## Как обновлять этот документ

1. Сначала измените `.oxlintrc.json` и, если нужно, scripts в `package.json`.
2. Проверьте `--print-config` на одном обычном файле и на файлах затронутых scopes.
3. Запустите `npm run lint` или `npm run verify:fast`.
4. Обновите здесь только команды, модель конфигурации и таблицу областей. Не копируйте полный
   каталог правил: он быстро устаревает и уже доступен в source config.

## Timings — только диагностика

Oxlint 1.76.0 умеет выводить per-rule timings:

```bash
npx oxlint --debug=timings --threads=1
```

Это одноразовый диагностический замер, а не нормативная документация. Результат зависит от
машины, текущего дерева, набора файлов и прогрева; JS-плагины и общие затраты запуска также могут
отражаться неполно. При расследовании производительности сохраняйте команду, окружение и результат
в issue или PR, но не переносите snapshots, call counts и таблицы всех правил в этот справочник.
