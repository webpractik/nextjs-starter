import type { Preview } from '@storybook/nextjs-vite'
import { geistSans } from '../src/fonts/geist'

import '../src/styles/globals.css'

const preview: Preview = {
	parameters: {
		controls: {
			expanded: true,
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
		tags: ['autodocs'],
		docs: {
			toc: true,
			codePanel: true,
		},
		layout: 'centered',
	},
	decorators: [
		Story => (
			<div className={geistSans.variable}>
				<Story />
			</div>
		),
	],
}

export default preview
