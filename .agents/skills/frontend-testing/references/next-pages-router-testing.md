# Next.js Pages Router testing

## Boundary

Используй этот reference для каталогов `pages`, `next/router`, page components,
`getStaticProps`, `getStaticPaths`, `getServerSideProps`, preview mode и API
route. Подтверди версию Next.js, установленный runner, существующие router/API
helpers, build mode и CI command; не переноси App Router assumptions.

## Decision table

| Pages Router surface | Минимальный уровень | Наблюдаемая граница |
| --- | --- | --- |
| Page UI и interaction | component/integration | DOM, accessibility tree и user flow |
| `next/router`-зависимое локальное поведение | component/integration | подтверждённый public router contract |
| `getStaticProps` | unit/integration | props, redirect или notFound result |
| `getStaticPaths` | unit/integration | paths и fallback contract |
| `getServerSideProps` | integration | request context и result contract |
| API route | Request/Response integration | method, status, headers и body |
| Реальный route/history/session | E2E | URL, document, cookies и browser history |

## Data functions

Вызывай data function с минимальным реалистичным context и проверяй публичный
return contract. Для `getStaticProps` покрывай данные и критический
`revalidate`/redirect/notFound исход. Для `getStaticPaths` проверяй params,
locale при наличии и выбранный fallback mode; browser fallback behavior выноси
в E2E.

Для `getServerSideProps` разделяй чистую domain-логику и request-bound работу.
Cookies, auth, headers, locale и upstream failure моделируй через существующие
project helpers или узкий adapter. Не создавай неполные огромные casts
`NextPageContext` только ради прохождения типов.

## Router behavior

Мокай только публичную границу `next/router`, если проверяется локальная реакция
page component. Воспроизводи минимально нужные `pathname`, `query`, `asPath`,
events и navigation result согласно установленной версии. Не копируй весь
router объект и не assertion-ь внутреннюю реализацию Next.js.

Проверяй Link, route change, shallow routing, back/forward и scroll/focus через
E2E, когда контракт зависит от browser history или загруженного документа.

## Redirects, errors, and preview

В narrow data-function test проверяй точную форму `redirect` или `notFound`.
Отдельный E2E доказывает конечный URL, status/UI и отсутствие redirect loop.
Проверяй custom `_app`, `_document`, `_error` только на их публичной границе.

Для preview mode проверь context (`preview`, `previewData`) и выбор data source;
если важны preview cookie, вход/выход и session isolation, используй E2E и
уникальный browser context.

## API routes

Используй уже принятый project helper для `NextApiRequest`/`NextApiResponse` или
реальный test server. Покрывай allowed method, invalid method, validation,
authorization, critical upstream failure, status, headers и response body.
Подменяй database, network, email/payment и другие side effects на внешней
границе; запрещай необработанный request и не направляй тест на production.

Прямой handler test не доказывает middleware, deployment rewrite, browser
navigation или session cookie flow — для этих контрактов добавляй E2E.
