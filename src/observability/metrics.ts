import type {
    Counter as PrometheusCounter,
    Histogram as PrometheusHistogram,
    Registry as PrometheusRegistry,
} from 'prom-client'

import client from 'prom-client'

const { collectDefaultMetrics } = client
const { Counter, Histogram, Registry } = client

interface MetricsState {
    register: PrometheusRegistry
    defaultMetricsCollected: boolean
    cacheOperationsTotal?: PrometheusCounter<'operation' | 'outcome'>
    cacheInvalidationsTotal?: PrometheusCounter<'mode' | 'outcome'>
    cacheOperationDurationSeconds?: PrometheusHistogram<'operation'>
}

declare global {
    var __nextjsStarterMetricsState: MetricsState | undefined
}

const metricsState = (globalThis.__nextjsStarterMetricsState ??= {
    register: new Registry(),
    defaultMetricsCollected: false,
})

export const register = metricsState.register

if (!metricsState.defaultMetricsCollected) {
    collectDefaultMetrics({
        prefix: process.env.APP_NAME as string,
        register,
    })
    metricsState.defaultMetricsCollected = true
}

const applicationName = process.env.APP_NAME ?? 'nextjs_starter'

export const cacheOperationsTotal = (metricsState.cacheOperationsTotal ??= new Counter({
    name: `${applicationName}_cache_operations_total`,
    help: 'Cache handler operations grouped by bounded operation and outcome labels.',
    labelNames: ['operation', 'outcome'] as const,
    registers: [register],
}))

export const cacheInvalidationsTotal = (metricsState.cacheInvalidationsTotal ??= new Counter({
    name: `${applicationName}_cache_invalidations_total`,
    help: 'Shared cache invalidations grouped by bounded mode and outcome labels.',
    labelNames: ['mode', 'outcome'] as const,
    registers: [register],
}))

export const cacheOperationDurationSeconds = (metricsState.cacheOperationDurationSeconds ??=
    new Histogram({
        name: `${applicationName}_cache_operation_duration_seconds`,
        help: 'Cache handler operation latency in seconds.',
        labelNames: ['operation'] as const,
        buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1],
        registers: [register],
    }))
