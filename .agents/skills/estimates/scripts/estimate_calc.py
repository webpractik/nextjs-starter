#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Детерминированный калькулятор оценки для скилла `estimates`.

Агент НЕ считает формулы сам — он готовит JSON с подзадачами и запускает этот
скрипт. Все коэффициенты, порядок слоёв и округления зашиты здесь и являются
единственным источником истины по арифметике.

Использование:
    python estimate_calc.py input.json              # markdown + сводка
    python estimate_calc.py input.json --json       # машинный JSON
    python estimate_calc.py --self-test             # проверка арифметики

Формат input.json:
{
  "task": "Аннулирование выданного сертификата",
  "slug": "certificate_revocation",
  "testing_coeff_be": 1.15,
  "testing_coeff_fe": 1.20,
  "subtasks": [
    {
      "side": "be",              // be | fe
      "name": "Поле status в Certificate",
      "type": "new",             // new | modify | config | repeat | test
      "component": "Миграция (таблица / iblock / HL-блок)",
      "source": "ref",           // ref | code | ai
      "re": 0.42,                // реальные часы С ИИ, из справочника или по коду
      "ai_fit": 1,               // 1..3 для BE, 1..4 для FE
      "comment": ""              // необязательно
    }
  ]
}
"""

import argparse
import json
import math
import sys

# ─────────────────────────────────────────────────────────────────────────────
# КОНСТАНТЫ РАСЧЁТА — единственный источник истины
# ─────────────────────────────────────────────────────────────────────────────

# Коэффициент пересчёта RE («с ИИ») → «с учётом AI-fit» («без ИИ»).
# Дельта (коэфф. − 1) снижена на 33% относительно исходных 2.2 / 1.5 / 1.2.
AI_FIT_COEFF = {
    1: 1.80,   # высокий прирост от ИИ   (было 2.2, дельта 1.20 → 0.80)
    2: 1.33,   # средний прирост         (было 1.5, дельта 0.50 → 0.33)
    3: 1.13,   # низкий прирост          (было 1.2, дельта 0.20 → 0.13)
    4: 1.13,   # только FE, равен уровню 3
}

# Множитель по типу подзадачи (масштаб работы, не связан с ИИ).
TYPE_MULT = {
    "new": 1.0,
    "modify": 0.6,
    "config": 0.2,
    "test": 1.0,
    # Повторное применение компонента, уже заведённого строкой `new` в этой же
    # задаче: второй и последующие однотипные экраны/каталоги/формы — это
    # переиспользование готового кода с другим источником данных, а не разработка
    # с нуля. Без этого типа три одинаковых каталога стоят как три разных.
    "repeat": 0.3,
}

# Типы подзадач, к которым НЕ применяется процентная надбавка за тестирование:
# их трудоёмкость уже заложена явной строкой декомпозиции.
TESTING_EXEMPT_TYPES = {"test"}

ALLOWED_TESTING_COEFFS = (1.10, 1.15, 1.20)

RISK_COEFF = 1.20      # фиксировано, не зависит от числа найденных рисков
PROFIT_COEFF = 1.25    # +25% рентабельность
WORKDAY_COEFF = 1.6    # 8/5 — перевод с 5-часового дня на 8-часовой

SUBTASK_ROUND = 0.1    # округление значений по подзадачам, вверх
LAYER_ROUND = 0.25     # округление итогов слоёв, вверх

SIDES = ("be", "fe")
SIDE_TITLE = {"be": "Backend", "fe": "Frontend"}


# ─────────────────────────────────────────────────────────────────────────────
# ВСПОМОГАТЕЛЬНОЕ
# ─────────────────────────────────────────────────────────────────────────────

def ceil_to(value, step):
    """Округление вверх до кратного step. Устойчиво к float-погрешности."""
    if value <= 0:
        return 0.0
    return math.ceil(round(value / step, 9)) * step


def fmt(value, digits=2):
    return f"{value:.{digits}f}"


class InputError(Exception):
    pass


# ─────────────────────────────────────────────────────────────────────────────
# ВАЛИДАЦИЯ
# ─────────────────────────────────────────────────────────────────────────────

def validate(data):
    if not isinstance(data, dict):
        raise InputError("корень JSON должен быть объектом")

    subtasks = data.get("subtasks")
    if not isinstance(subtasks, list) or not subtasks:
        raise InputError("`subtasks` обязателен и должен быть непустым списком")

    for side in SIDES:
        key = f"testing_coeff_{side}"
        coeff = data.get(key)
        if coeff is None:
            continue
        if round(float(coeff), 4) not in ALLOWED_TESTING_COEFFS:
            raise InputError(
                f"{key}={coeff} — допустимы только "
                f"{', '.join(str(c) for c in ALLOWED_TESTING_COEFFS)} (10/15/20%)"
            )

    for i, st in enumerate(subtasks, 1):
        where = f"subtasks[{i}] ({st.get('name', 'без имени')})"
        if st.get("side") not in SIDES:
            raise InputError(f"{where}: `side` должен быть 'be' или 'fe'")
        if st.get("type") not in TYPE_MULT:
            raise InputError(
                f"{where}: `type` должен быть одним из {sorted(TYPE_MULT)}"
            )
        if st.get("source") not in ("ref", "code", "ai"):
            raise InputError(f"{where}: `source` должен быть 'ref', 'code' или 'ai'")
        try:
            re_val = float(st.get("re"))
        except (TypeError, ValueError):
            raise InputError(f"{where}: `re` обязателен и должен быть числом")
        if re_val < 0:
            raise InputError(f"{where}: `re` не может быть отрицательным")
        ai_fit = st.get("ai_fit")
        if ai_fit not in AI_FIT_COEFF:
            raise InputError(
                f"{where}: `ai_fit` должен быть 1..4 (BE: 1-3, FE: 1-4), получено {ai_fit!r}"
            )
        if st["side"] == "be" and ai_fit == 4:
            raise InputError(f"{where}: ai_fit=4 существует только во FE-справочнике")

    for side in SIDES:
        has = any(st["side"] == side for st in subtasks)
        if has and data.get(f"testing_coeff_{side}") is None:
            raise InputError(
                f"есть подзадачи {SIDE_TITLE[side]}, но не задан testing_coeff_{side}"
            )


# ─────────────────────────────────────────────────────────────────────────────
# РАСЧЁТ
# ─────────────────────────────────────────────────────────────────────────────

def compute(data):
    validate(data)
    subtasks = data["subtasks"]

    rows = []
    for st in subtasks:
        side = st["side"]
        testing_coeff = float(data[f"testing_coeff_{side}"])
        type_mult = TYPE_MULT[st["type"]]
        ai_coeff = AI_FIT_COEFF[st["ai_fit"]]

        re_adj = float(st["re"]) * type_mult
        aifit = re_adj * ai_coeff

        exempt = st["type"] in TESTING_EXEMPT_TYPES
        applied_testing = 1.0 if exempt else testing_coeff
        testing = aifit * applied_testing

        rows.append({
            "side": side,
            "name": st["name"],
            "type": st["type"],
            "component": st.get("component", ""),
            "source": st["source"],
            "comment": st.get("comment", ""),
            "re_raw": float(st["re"]),
            "type_mult": type_mult,
            "re": re_adj,
            "ai_fit": st["ai_fit"],
            "ai_coeff": ai_coeff,
            "aifit": aifit,
            "testing_applied": applied_testing,
            "testing_exempt": exempt,
            "testing": testing,
        })

    layers = {}
    for side in SIDES:
        side_rows = [r for r in rows if r["side"] == side]
        if not side_rows:
            layers[side] = None
            continue

        re_base = sum(r["re"] for r in side_rows)
        aifit_base = sum(r["aifit"] for r in side_rows)
        testing_total = sum(r["testing"] for r in side_rows)
        risk = testing_total * RISK_COEFF
        profit = risk * PROFIT_COEFF
        final = profit * WORKDAY_COEFF

        layers[side] = {
            "re": re_base,
            "aifit": aifit_base,
            "testing": testing_total,
            "risk": risk,
            "profit": profit,
            "final": final,
            "economy_ai": aifit_base - re_base,
            "testing_coeff": float(data[f"testing_coeff_{side}"]),
            "exempt_hours": sum(r["aifit"] for r in side_rows if r["testing_exempt"]),
            "subtask_count": len(side_rows),
        }

    def total(key):
        return sum(layers[s][key] for s in SIDES if layers[s])

    totals = {
        k: total(k)
        for k in ("re", "aifit", "testing", "risk", "profit", "final", "economy_ai")
    }

    return {
        "task": data.get("task", ""),
        "slug": data.get("slug", ""),
        "rows": rows,
        "layers": layers,
        "totals": totals,
        "constants": {
            "ai_fit_coeff": AI_FIT_COEFF,
            "type_mult": TYPE_MULT,
            "risk_coeff": RISK_COEFF,
            "profit_coeff": PROFIT_COEFF,
            "workday_coeff": WORKDAY_COEFF,
            "testing_exempt_types": sorted(TESTING_EXEMPT_TYPES),
        },
    }


# ─────────────────────────────────────────────────────────────────────────────
# ВЫВОД
# ─────────────────────────────────────────────────────────────────────────────

MARK = {"ref": "", "code": " 🔍", "ai": " ⚠️"}


def render_markdown(result):
    out = []
    task = result["task"]
    out.append(f"## Оценка: {task}" if task else "## Оценка")
    out.append("")

    for side in SIDES:
        layer = result["layers"][side]
        if not layer:
            continue
        out.append(f"### {SIDE_TITLE[side]}")
        out.append("")
        out.append(
            "| Подзадача | Тип | RE (ч, с ИИ) | AI-fit | Коэфф. | "
            "С учётом AI-fit (ч, без ИИ) | С тестированием (ч) | Компонент |"
        )
        out.append("|---|---|---|---|---|---|---|---|")
        for r in (x for x in result["rows"] if x["side"] == side):
            note = "" if not r["testing_exempt"] else " ¹"
            out.append(
                f"| {r['name']}{MARK[r['source']]} | {r['type']} "
                f"| {fmt(ceil_to(r['re'], SUBTASK_ROUND), 1)} "
                f"| {r['ai_fit']} | ×{fmt(r['ai_coeff'], 2)} "
                f"| {fmt(ceil_to(r['aifit'], SUBTASK_ROUND), 1)} "
                f"| {fmt(ceil_to(r['testing'], SUBTASK_ROUND), 1)}{note} "
                f"| {r['component']} |"
            )
        out.append("")
        if layer["exempt_hours"] > 0:
            out.append(
                f"¹ Строки типа `test` — надбавка за тестирование "
                f"(×{fmt(layer['testing_coeff'], 2)}) к ним не применяется: "
                f"их трудоёмкость уже учтена явной строкой декомпозиции."
            )
            out.append("")

    out.append("### Послойный расчёт")
    out.append("")
    out.append("| Слой | Бэкенд (ч) | Фронтенд (ч) | Итого (ч) |")
    out.append("|---|---|---|---|")

    be, fe = result["layers"]["be"], result["layers"]["fe"]
    t = result["totals"]

    def cell(layer, key):
        if not layer:
            return "—"
        return fmt(ceil_to(layer[key], LAYER_ROUND))

    tc_be = fmt(be["testing_coeff"], 2) if be else "—"
    tc_fe = fmt(fe["testing_coeff"], 2) if fe else "—"

    spec = [
        ("RE — реальная оценка с ИИ", "re"),
        ("С учётом AI-fit (RE × коэфф. ускорения = эквивалент без ИИ)", "aifit"),
        (f"С тестированием (BE ×{tc_be} · FE ×{tc_fe})", "testing"),
        (f"С тестированием + рисками (×{fmt(RISK_COEFF, 2)}, фиксировано)", "risk"),
        (f"С учётом рентабельности (+{int((PROFIT_COEFF - 1) * 100)}%)", "profit"),
        (
            f"**Перевод на 8-часовой рабочий день (×{WORKDAY_COEFF}) "
            f"— итоговая цена для заказчика**",
            "final",
        ),
    ]
    for label, key in spec:
        bold = key == "final"
        wrap = (lambda s: f"**{s}**") if bold else (lambda s: s)
        out.append(
            f"| {label} | {wrap(cell(be, key))} | {wrap(cell(fe, key))} "
            f"| {wrap(fmt(ceil_to(t[key], LAYER_ROUND)))} |"
        )

    out.append("")
    e_be = fmt(ceil_to(be["economy_ai"], LAYER_ROUND), 1) if be else "0"
    e_fe = fmt(ceil_to(fe["economy_ai"], LAYER_ROUND), 1) if fe else "0"
    out.append(
        f"**Экономия от ИИ** (с учётом AI-fit минус RE, без тестирования/рисков/"
        f"рентабельности/перевода в 8ч): Backend −{e_be} ч · "
        f"Frontend −{e_fe} ч · Итого −{fmt(ceil_to(t['economy_ai'], LAYER_ROUND), 1)} ч"
    )
    return "\n".join(out)


def render_frontmatter(result):
    be, fe = result["layers"]["be"], result["layers"]["fe"]
    t = result["totals"]

    def v(layer, key):
        return fmt(ceil_to(layer[key], LAYER_ROUND)) if layer else "0.0"

    lines = [
        f're_be_hours: {v(be, "re")}',
        f're_fe_hours: {v(fe, "re")}',
        f'ai_fit_be_hours: {v(be, "aifit")}',
        f'ai_fit_fe_hours: {v(fe, "aifit")}',
        f'economy_ai_be_hours: {v(be, "economy_ai")}',
        f'economy_ai_fe_hours: {v(fe, "economy_ai")}',
        f'testing_coeff_be: {fmt(be["testing_coeff"], 2) if be else "—"}',
        f'testing_coeff_fe: {fmt(fe["testing_coeff"], 2) if fe else "—"}',
        f'risk_coeff: {fmt(RISK_COEFF, 2)}',
        f'price_final_be: {v(be, "final")}',
        f'price_final_fe: {v(fe, "final")}',
        f'price_final_total: {fmt(ceil_to(t["final"], LAYER_ROUND))}',
    ]
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# SELF-TEST
# ─────────────────────────────────────────────────────────────────────────────

def self_test():
    checks = []

    def check(name, got, want, tol=1e-9):
        ok = abs(got - want) < tol
        checks.append((ok, name, got, want))
        return ok

    # 1. Базовая цепочка: RE 10ч, ai_fit=2 (1.33), testing 1.20
    data = {
        "task": "t", "slug": "t",
        "testing_coeff_be": 1.20, "testing_coeff_fe": None,
        "subtasks": [{"side": "be", "name": "a", "type": "new", "component": "c",
                      "source": "ref", "re": 10.0, "ai_fit": 2}],
    }
    r = compute(data)
    be = r["layers"]["be"]
    check("RE не меняется", be["re"], 10.0)
    check("AI-fit = 10 × 1.33", be["aifit"], 13.3)
    check("тестирование = 13.3 × 1.20", be["testing"], 13.3 * 1.20)
    check("риски = × 1.20", be["risk"], 13.3 * 1.20 * 1.20)
    check("рентабельность = × 1.25", be["profit"], 13.3 * 1.20 * 1.20 * 1.25)
    check("8ч = × 1.6", be["final"], 13.3 * 1.20 * 1.20 * 1.25 * 1.6)
    check("экономия от ИИ", be["economy_ai"], 3.3)

    # 2. type-множители
    for tp, mult in (("new", 1.0), ("modify", 0.6), ("config", 0.2),
                     ("test", 1.0), ("repeat", 0.3)):
        d = {"testing_coeff_be": 1.10, "testing_coeff_fe": None,
             "subtasks": [{"side": "be", "name": tp, "type": tp, "component": "c",
                           "source": "ref", "re": 5.0, "ai_fit": 3}]}
        check(f"type={tp} → ×{mult}", compute(d)["layers"]["be"]["re"], 5.0 * mult)

    # 3. Строки типа `test` освобождены от надбавки за тестирование
    d = {"testing_coeff_be": 1.20, "testing_coeff_fe": None,
         "subtasks": [
             {"side": "be", "name": "код", "type": "new", "component": "c",
              "source": "ref", "re": 10.0, "ai_fit": 3},
             {"side": "be", "name": "тест", "type": "test", "component": "c",
              "source": "ref", "re": 10.0, "ai_fit": 3},
         ]}
    be = compute(d)["layers"]["be"]
    aifit_each = 10.0 * 1.13
    check("test-строка без надбавки",
          be["testing"], aifit_each * 1.20 + aifit_each * 1.0)

    # 3b. `repeat` — продуктовый код, надбавку за тестирование получает
    d = {"testing_coeff_fe": 1.20, "testing_coeff_be": None,
         "subtasks": [{"side": "fe", "name": "2-й каталог", "type": "repeat",
                       "component": "c", "source": "ref", "re": 10.0, "ai_fit": 2}]}
    fe = compute(d)["layers"]["fe"]
    check("repeat: RE = 10 × 0.3", fe["re"], 3.0)
    check("repeat: надбавка применяется", fe["testing"], 3.0 * 1.33 * 1.20)

    # 4. AI-fit: дельта снижена ровно на 33% от исходных значений
    for lvl, old in ((1, 2.2), (2, 1.5), (3, 1.2)):
        new = AI_FIT_COEFF[lvl]
        cut = 1 - (new - 1) / (old - 1)
        checks.append((0.30 - 1e-9 <= cut <= 0.35 + 1e-9,
                       f"AI-fit {lvl}: дельта {old - 1:.2f}→{new - 1:.2f} "
                       f"(−{cut * 100:.0f}%)", cut, 0.33))

    # 5. Все коэффициенты > 1 (инвариант «без ИИ дороже, чем с ИИ»)
    for lvl, c in AI_FIT_COEFF.items():
        checks.append((c > 1.0, f"AI-fit {lvl} коэфф. > 1.0", c, 1.0))

    # 6. Округление вверх
    check("ceil_to(1.01, 0.25)", ceil_to(1.01, 0.25), 1.25)
    check("ceil_to(1.25, 0.25)", ceil_to(1.25, 0.25), 1.25)
    check("ceil_to(0.31, 0.1)", ceil_to(0.31, 0.1), 0.4)

    # 7. Детерминированность
    d = {"testing_coeff_be": 1.15, "testing_coeff_fe": 1.20, "subtasks": [
        {"side": "be", "name": "a", "type": "new", "component": "c",
         "source": "ref", "re": 3.7, "ai_fit": 1},
        {"side": "fe", "name": "b", "type": "modify", "component": "c",
         "source": "ai", "re": 6.3, "ai_fit": 4},
    ]}
    a = json.dumps(compute(d)["totals"], sort_keys=True)
    b = json.dumps(compute(d)["totals"], sort_keys=True)
    checks.append((a == b, "повторный расчёт даёт тот же результат", 1, 1))

    # 8. Валидация ловит ошибки
    for bad, why in (
        ({"testing_coeff_be": 1.30, "subtasks": [
            {"side": "be", "name": "a", "type": "new", "component": "c",
             "source": "ref", "re": 1, "ai_fit": 1}]}, "недопустимый testing_coeff"),
        ({"testing_coeff_be": 1.10, "subtasks": [
            {"side": "be", "name": "a", "type": "new", "component": "c",
             "source": "ref", "re": 1, "ai_fit": 4}]}, "ai_fit=4 на BE"),
        ({"testing_coeff_be": 1.10, "subtasks": [
            {"side": "be", "name": "a", "type": "wat", "component": "c",
             "source": "ref", "re": 1, "ai_fit": 1}]}, "неизвестный type"),
        ({"testing_coeff_fe": 1.10, "subtasks": [
            {"side": "be", "name": "a", "type": "new", "component": "c",
             "source": "ref", "re": 1, "ai_fit": 1}]}, "нет testing_coeff_be"),
    ):
        try:
            compute(bad)
            checks.append((False, f"валидация: {why}", 0, 1))
        except InputError:
            checks.append((True, f"валидация ловит: {why}", 1, 1))

    failed = [c for c in checks if not c[0]]
    for ok, name, got, want in checks:
        print(f"  {'✓' if ok else '✗'} {name}"
              + ("" if ok else f"  (получено {got}, ожидалось {want})"))
    print()
    print(f"{len(checks) - len(failed)}/{len(checks)} проверок пройдено")
    return 1 if failed else 0


# ─────────────────────────────────────────────────────────────────────────────

def main():
    p = argparse.ArgumentParser(
        description="Детерминированный расчёт оценки для скилла estimates")
    p.add_argument("input", nargs="?", help="путь к JSON с подзадачами")
    p.add_argument("--json", action="store_true", help="машинный вывод")
    p.add_argument("--self-test", action="store_true", help="проверка арифметики")
    args = p.parse_args()

    if args.self_test:
        return self_test()

    if not args.input:
        p.error("нужен путь к input.json (или флаг --self-test)")

    try:
        with open(args.input, encoding="utf-8") as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Файл не найден: {args.input}", file=sys.stderr)
        return 2
    except json.JSONDecodeError as e:
        print(f"Некорректный JSON: {e}", file=sys.stderr)
        return 2

    try:
        result = compute(data)
    except InputError as e:
        print(f"Ошибка во входных данных: {e}", file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print(render_markdown(result))
        print()
        print("<!-- фронтматтер для estimate.md -->")
        print(render_frontmatter(result))
    return 0


if __name__ == "__main__":
    sys.exit(main())
