# Состояние миграции Hey API → Kubb 5

Актуализировано 2026-10-09. [Принятый план](plan.md),
[проверки и ограничения](../docs/dependency-updates.md).

- [x] Зафиксировать baseline и сохранить исходное изменение `next-env.d.ts`.
- [x] Проверить неизменный OpenAPI 3.2.0 на Kubb; зафиксировать границу поддержки текущего контракта.
- [x] Настроить Kubb types/Zod/Faker/client и сохранить строгую проверку всего output TypeScript 7.
- [x] Сохранить Fetch transport, base URL policy, native options/Response, parsed errors и `204`.
- [x] Сохранить шесть public facets и documented operation/model/schema/factory names.
- [x] Генерировать Query/mutation/infinite options; проверить tags, адреса ключей, offset и cancellation.
- [x] Сохранить request-local Faker, mock scenarios и contract-driven mock routes/cache tags.
- [x] Переключить helpers и основной gen; подтвердить воспроизводимость всех 61 generated files.
- [x] Удалить Hey API, старый output, resolution hook и прямую workspace TypeScript 6 dependency.
- [x] Обновить все прямые dependencies/devDependencies и lockfile через npm; проверить latest registry.
- [x] Проверить чистый npm ci и gen:check в изолированной копии.
- [x] Проверить SDK в Chromium и в Next.js Server/Client Components в development и production.
- [x] Добавить gen:check перед verify:fast в GitLab CI и воспроизвести проверку локально.
- [x] Обновить API/runtime/testing/deployment docs и просмотреть итоговый diff.
- [x] Подготовить изменения к scoped commit/push в origin/main; отправка подтверждается Git history.

Дополнительные проверки не стали зелёными: Knip выдаёт замечания также на исходном HEAD;
JSCPD на итоговом дереве показывает 2.9% при пороге 2%. Порог и правила не ослаблялись.
Runtime audit не находит уязвимостей; полный audit сохраняет 11 high findings в dev graph,
связанных с пока не исправленным upstream `braces`. Подробности приведены в отчёте.
