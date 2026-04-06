import {
	defaultShouldDehydrateQuery,
	environmentManager,
	QueryClient,
} from '@tanstack/react-query'

function makeQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 60 * 1000,
			},
			dehydrate: {
				shouldDehydrateQuery: query =>
					defaultShouldDehydrateQuery(query)
					|| query.state.status === 'pending',
				shouldRedactErrors: () => {
					return false
				},
			},
		},
	})
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
	if (environmentManager.isServer()) {
		return makeQueryClient()
	}
	else {
		if (!browserQueryClient) {
			return browserQueryClient = makeQueryClient()
		}

		return browserQueryClient
	}
}
