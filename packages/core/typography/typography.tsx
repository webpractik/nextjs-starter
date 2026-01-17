import type { ComponentProps, JSX, ReactNode, Ref } from 'react'
import { typographyVariants } from './variants'

type TypographyProps = {
	center?: boolean
	children: ReactNode
	className?: string
	color?: 'primary'
	ref?: Ref<HTMLParagraphElement>
	variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span'
} & ComponentProps<'p'>

export function Typography({
	center,
	children,
	className = '',
	color,
	ref,
	variant = 'p',
	...props
}: TypographyProps) {
	const Component: keyof JSX.IntrinsicElements = variant

	return (
		<Component
			ref={ref}
			{...props}
			className={typographyVariants({ center, className, color, variant })}
		>
			{children}
		</Component>
	)
}

Typography.displayName = 'Typography'
