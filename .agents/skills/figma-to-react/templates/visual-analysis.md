# Визуальный анализ

Оставь по одной строке на категорию и замени все подсказки. В `Status` используй только `match`, `mismatch` или `not-applicable`. Таблица должна быть видимой: не помещай её в HTML, комментарий или блок кода.

| Category | Status | Evidence | Diagnosis | Disposition |
| --- | --- | --- | --- | --- |
| geometry | `<status>` | `<проверенные свойства; для mismatch добавь Issue refs: N>` | `<expected и actual; ровно один уровень: macro или micro>` | `<accepted: no action / not applicable: no action / next fix: ... / accepted micro residual: ...>` |
| spacing | `<status>` | `<проверенные свойства; для mismatch добавь Issue refs: N>` | `<expected и actual; ровно один уровень: macro или micro>` | `<accepted: no action / not applicable: no action / next fix: ... / accepted micro residual: ...>` |
| typography | `<status>` | `<проверенные свойства; для mismatch добавь Issue refs: N>` | `<expected и actual; ровно один уровень: macro или micro>` | `<accepted: no action / not applicable: no action / next fix: ... / accepted micro residual: ...>` |
| colors | `<status>` | `<проверенные свойства; для mismatch добавь Issue refs: N>` | `<expected и actual; ровно один уровень: macro или micro>` | `<accepted: no action / not applicable: no action / next fix: ... / accepted micro residual: ...>` |
| borders and shadows | `<status>` | `<проверенные свойства; для mismatch добавь Issue refs: N>` | `<expected и actual; ровно один уровень: macro или micro>` | `<accepted: no action / not applicable: no action / next fix: ... / accepted micro residual: ...>` |
| assets | `<status>` | `<происхождение ресурсов; для mismatch добавь Issue refs: N>` | `<expected и actual; ровно один уровень: macro или micro>` | `<accepted: no action / not applicable: no action / next fix: ...>` |
| responsive behavior | `<status>` | `<проверенные переходы; для mismatch добавь Issue refs: N>` | `<expected и actual; ровно один уровень: macro или micro>` | `<accepted: no action / not applicable: no action / next fix: ...>` |
| missing or extra elements | `<status>` | `<проверенный состав; для mismatch добавь Issue refs: N>` | `<expected и actual; ровно один уровень: macro или micro>` | `<accepted: no action / not applicable: no action / next fix: ...>` |

Для `match` укажи `accepted: no action`, для `not-applicable` укажи `not applicable: no action`. Маркер `Issue refs:` разрешён только в `Evidence` строки `mismatch`. Номера идут по возрастанию и один к одному соответствуют `result.json.issues`. Допустимое мелкое различие в категориях `geometry`, `spacing`, `typography`, `colors` или `borders and shadows` начинается с `accepted micro residual:` и требует отдельного ручного одобрения, связанного с этой итерацией.
