/**
 * @type {import('lint-staged').Configuration}
 */
export default {
	'*.ts?(x)': () => 'bun run tsc',
	'*.{js?(x),ts?(x)}': 'bun run lint',
	// '*.test.{js,jsx,ts,tsx}': () => 'bun run unit-test',
}
