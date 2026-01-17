import { cva } from 'class-variance-authority'

export const typographyVariants = cva('font-sans leading-tight text-balance', {
	defaultVariants: {
		variant: 'p',
	},
	variants: {
		center: {
			true: 'text-center',
		},
		color: {
			primary: 'text-black',
		},
		variant: {
			h1: `text-3xl font-bold`,
			h2: `text-2xl font-semibold`,
			h3: 'text-xl font-semibold',
			h4: 'text-xl font-medium',
			h5: 'text-lg font-medium',
			h6: 'text-base font-medium',
			p: 'text-base font-normal',
			span: '',
		},
	},
})
