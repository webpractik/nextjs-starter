import type { ContractModel } from './contract'

import { adapterOas } from '@kubb/adapter-oas'

export async function assertKubbContractParity(contract: ContractModel, bundlePath: string) {
    const adapter = adapterOas({ validate: false })
    const ast = await adapter.parse({ type: 'path', path: bundlePath })

    if (adapter.document?.openapi !== contract.openapi) {
        throw new Error('Kubb changed the canonical OpenAPI version')
    }

    const expected = contract.operations.map((operation) => ({
        operationId: operation.operationId,
        method: operation.method,
        path: operation.path,
        tags: operation.tags,
        pathParameters: operation.pathParameters.map((parameter) => parameter.name).sort(),
        responses: operation.responses.map((response) => ({
            status: response.status,
            hasBody: response.hasBody,
        })),
    }))
    const actual = ast.operations.map((operation) => ({
        operationId: operation.operationId,
        method: operation.method?.toLowerCase(),
        path: operation.path,
        tags: operation.tags ?? [],
        pathParameters: operation.parameters
            .filter((parameter) => parameter.in === 'path')
            .map((parameter) => parameter.name)
            .sort(),
        responses: operation.responses.map((response) => {
            const status = Number(response.statusCode)
            const canonical = contract.operations
                .find((item) => item.operationId === operation.operationId)
                ?.responses.find((item) => item.status === status)
            // The adapter synthesizes an unknown JSON schema for a bodyless response.
            // generateKubbFacets replaces this guarded shape with undefined in types and Zod.
            const syntheticEmpty =
                canonical?.hasBody === false &&
                response.content?.every((content) => content.schema?.type === 'unknown') === true
            return {
                status,
                hasBody:
                    !syntheticEmpty &&
                    (response.content?.some((content) => content.schema !== undefined) ?? false),
            }
        }),
    }))

    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        throw new Error(
            'Kubb AST differs from the canonical contract operations/parameters/responses',
        )
    }
}
