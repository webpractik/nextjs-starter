# Декомпозиция React-кода

## Когда читать

Читайте этот reference при создании или разделении component, проверке размера
production file, выборе Atomic Design level или review правила «один component
на файл».

## Содержание

- [Числовые gates](#числовые-gates)
- [Один component на файл](#один-component-на-файл)
- [Карта extraction](#карта-extraction)
- [Классификация Atomic Design](#классификация-atomic-design)
- [Команды проверки](#команды-проверки)
- [Запись decomposition review](#запись-decomposition-review)
- [Тревожные признаки](#тревожные-признаки)

## Числовые gates

- 0–200 lines: numeric review не требуется, responsibility review сохраняется.
- 201–800 lines: обязательный documented decomposition review.
- Более 800 lines: hard failure для production component file.

Считайте весь physical file, включая imports, types, helpers, JSX, comments и
пустые строки. Исключайте tests, Stories, fixtures и generated code. Line count
является gate, а не целью: не уплотняйте код и не объединяйте строки ради его
прохождения.

Для каждого production component file длиннее 200 lines review отвечает минимум
на четыре вопроса: сколько у file причин для изменения, кому принадлежат
responsibilities, где проходят interface/seam и что можно извлечь без изменения
behavior.

## Один component на файл

Production file объявляет ровно один React component. memo и forwardRef
считаются wrappers того же component. Nested component declarations запрещены.
Compound parts получают отдельные files. Entry point может re-export, но не
объявляет component. Tests, Stories, fixtures и generated code освобождены от
этого production gate.

Local types, constants и helpers допустимы, пока не образуют вторую
responsibility или второй component.

## Карта extraction

| Ответственность | Куда выделять |
| --- | --- |
| Самостоятельная visual region | component |
| Pure invariant/policy | domain |
| Use-case orchestration | application |
| HTTP/storage/browser I/O | infrastructure adapter |
| DTO/error conversion | adapter seam |
| Display preparation | presenter/view-model mapper |
| External subscription | store adapter + useSyncExternalStore hook |

Не создавайте pass-through wrappers и one-line abstractions только ради line
count. Reuse не обязателен: отдельная reason to change уже оправдывает
extraction.

## Классификация Atomic Design

- Atom: неделимый domain-neutral primitive.
- Molecule: малая композиция с одной UI-задачей.
- Organism: самостоятельная feature section.
- Template: page structure и slots без concrete data.
- Page: route-level composition с real data/state.

Stories создаются только для atoms/molecules. Organisms получают
component/integration tests, templates — structural/layout tests, pages —
integration/E2E tests. Stories для трёх верхних levels не создаются.

## Команды проверки

Сначала получите changed/in-scope candidates средствами проекта и
классифицируйте их AST-aware tooling или manual review. Передавайте в первый
check только подтверждённые production component files, а во второй — только
in-scope Story files. Не приравнивайте все `.tsx` к React components. Для явно
согласованного broad scope передайте все подтверждённые files repository.

```bash
check_component_sizes() {
  local too_large=0 file lines
  for file in "$@"; do
    lines=$(awk 'END { print NR }' "$file")
    if [ "$lines" -gt 200 ]; then
      printf '%s %s\n' "$lines" "$file"
    fi
    if [ "$lines" -gt 800 ]; then
      too_large=1
    fi
  done
  return "$too_large"
}

check_story_levels() {
  local file invalid=0
  for file in "$@"; do
    if printf '%s\n' "$file" \
      | rg -q '(^|/)(organisms|templates|pages)/.*\.stories\.[jt]sx?$'; then
      printf 'forbidden Story level: %s\n' "$file"
      invalid=1
    fi
  done
  return "$invalid"
}
```

Вызовите `check_component_sizes` со списком in-scope production component files,
а `check_story_levels` — со списком in-scope Story files. Первый check показывает
size candidates и завершается non-zero при превышении 800 lines. Второй
запрещает Stories верхних Atomic Design levels. Количество components проверяйте
AST-aware lint/tooling и manual review; regex используйте только как candidate
scan и не выдавайте за доказательство. Если AST-aware rule отсутствует,
предложите минимальный вариант и согласуйте новую dependency до изменения
manifest.

## Запись decomposition review

Для каждого production component file больше 200 lines запишите:

| File | Lines | Responsibilities | Решение | Извлечённые modules |
| --- | ---: | --- | --- | --- |

Поле «Решение» принимает только значение keep или decompose и содержит
конкретную причину.

## Тревожные признаки

- Business decision внутри JSX/controller hook.
- Несколько component declarations в production file.
- Nested component теряет state при parent render.
- Extraction выполнен только ради числа строк.
- Feature-specific organism перемещён в shared.
- Story создана для organism/template/page.
