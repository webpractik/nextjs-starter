import { Skeleton } from '@repo/core/skeleton'

export default function RootLoading() {
	return (
		<div className="flex size-full flex-col items-center justify-center gap-4 p-8">
			<Skeleton className="h-8 w-48" />
			<Skeleton className="h-4 w-96" />
			<Skeleton className="h-4 w-80" />
		</div>
	)
}
