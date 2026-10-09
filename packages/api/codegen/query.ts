// ВНИМАНИЕ: файл сгенерирован из OpenAPI/Kubb. Не редактируйте вручную.

import type { Client, Options, RequestResult } from '../client'

import {
    infiniteQueryOptions,
    queryOptions,
    type InfiniteData,
    type UseMutationOptions,
} from '@tanstack/react-query'

import { client } from '../client'
interface KeyOptions {
    baseUrl?: string
    body?: unknown
    client?: Client
    headers?: HeadersInit
    path?: object
    query?: object
}
export function createQueryKey(
    id: string,
    options: KeyOptions = {},
    tags: readonly string[] = [],
    infinite = false,
) {
    return [
        {
            _id: id,
            baseUrl: options.baseUrl ?? (options.client ?? client).getConfig().baseUrl,
            body: options.body,
            headers: options.headers,
            path: options.path,
            query: options.query,
            tags,
            ...(infinite ? { _infinite: true } : {}),
        },
    ] as const
}
import type { FindPetsByStatusOptions, FindPetsByStatusResponses } from './types/FindPetsByStatus'

import { findPetsByStatus } from './clients/findPetsByStatus'
type FindPetsByStatusError = Exclude<RequestResult<FindPetsByStatusResponses>['error'], undefined>
export const findPetsByStatusQueryKey = (options: Options<FindPetsByStatusOptions> = {}) =>
    createQueryKey('findPetsByStatus', options, ['pets'])
export const findPetsByStatusOptions = (options: Options<FindPetsByStatusOptions> = {}) =>
    queryOptions<
        RequestResult<FindPetsByStatusResponses, true>['data'],
        FindPetsByStatusError,
        RequestResult<FindPetsByStatusResponses, true>['data'],
        ReturnType<typeof findPetsByStatusQueryKey>
    >({
        queryKey: findPetsByStatusQueryKey(options),
        queryFn: async ({ queryKey, signal }) =>
            (
                await findPetsByStatus({
                    ...options,
                    baseUrl: queryKey[0].baseUrl,
                    signal,
                    throwOnError: true,
                })
            ).data,
    })
export const findPetsByStatusInfiniteQueryKey = (options: Options<FindPetsByStatusOptions> = {}) =>
    createQueryKey('findPetsByStatus', options, ['pets'], true)
export const findPetsByStatusInfiniteOptions = (options: Options<FindPetsByStatusOptions> = {}) =>
    infiniteQueryOptions<
        RequestResult<FindPetsByStatusResponses, true>['data'],
        FindPetsByStatusError,
        InfiniteData<RequestResult<FindPetsByStatusResponses, true>['data'], number>,
        ReturnType<typeof findPetsByStatusInfiniteQueryKey>,
        number
    >({
        initialPageParam: 0,
        getNextPageParam: () => undefined,
        queryKey: findPetsByStatusInfiniteQueryKey(options),
        queryFn: async ({ queryKey, signal, pageParam }) =>
            (
                await findPetsByStatus({
                    ...options,
                    baseUrl: queryKey[0].baseUrl,
                    query: { ...options.query, offset: pageParam },
                    signal,
                    throwOnError: true,
                })
            ).data,
    })
import type { CreatePetOptions, CreatePetResponses } from './types/CreatePet'

import { createPet } from './clients/createPet'
type CreatePetError = Exclude<RequestResult<CreatePetResponses>['error'], undefined>
export const createPetMutationKey = (options: Partial<Options<CreatePetOptions>> = {}) =>
    createQueryKey('createPet', options, ['pets'])
export const createPetMutation = (
    options: Partial<Options<CreatePetOptions>> = {},
): UseMutationOptions<
    RequestResult<CreatePetResponses, true>['data'],
    CreatePetError,
    Options<CreatePetOptions>
> => ({
    mutationKey: createPetMutationKey(options),
    mutationFn: async (variables) =>
        (await createPet({ ...options, ...variables, throwOnError: true })).data,
})
import type { GetPetByIdOptions, GetPetByIdResponses } from './types/GetPetById'

import { getPetById } from './clients/getPetById'
type GetPetByIdError = Exclude<RequestResult<GetPetByIdResponses>['error'], undefined>
export const getPetByIdQueryKey = (options: Options<GetPetByIdOptions>) =>
    createQueryKey('getPetById', options, ['pets'])
export const getPetByIdOptions = (options: Options<GetPetByIdOptions>) =>
    queryOptions<
        RequestResult<GetPetByIdResponses, true>['data'],
        GetPetByIdError,
        RequestResult<GetPetByIdResponses, true>['data'],
        ReturnType<typeof getPetByIdQueryKey>
    >({
        queryKey: getPetByIdQueryKey(options),
        queryFn: async ({ queryKey, signal }) =>
            (
                await getPetById({
                    ...options,
                    baseUrl: queryKey[0].baseUrl,
                    signal,
                    throwOnError: true,
                })
            ).data,
    })
import type { UpdatePetOptions, UpdatePetResponses } from './types/UpdatePet'

import { updatePet } from './clients/updatePet'
type UpdatePetError = Exclude<RequestResult<UpdatePetResponses>['error'], undefined>
export const updatePetMutationKey = (options: Partial<Options<UpdatePetOptions>> = {}) =>
    createQueryKey('updatePet', options, ['pets'])
export const updatePetMutation = (
    options: Partial<Options<UpdatePetOptions>> = {},
): UseMutationOptions<
    RequestResult<UpdatePetResponses, true>['data'],
    UpdatePetError,
    Options<UpdatePetOptions>
> => ({
    mutationKey: updatePetMutationKey(options),
    mutationFn: async (variables) =>
        (await updatePet({ ...options, ...variables, throwOnError: true })).data,
})
import type { DeletePetOptions, DeletePetResponses } from './types/DeletePet'

import { deletePet } from './clients/deletePet'
type DeletePetError = Exclude<RequestResult<DeletePetResponses>['error'], undefined>
export const deletePetMutationKey = (options: Partial<Options<DeletePetOptions>> = {}) =>
    createQueryKey('deletePet', options, ['pets'])
export const deletePetMutation = (
    options: Partial<Options<DeletePetOptions>> = {},
): UseMutationOptions<
    RequestResult<DeletePetResponses, true>['data'],
    DeletePetError,
    Options<DeletePetOptions>
> => ({
    mutationKey: deletePetMutationKey(options),
    mutationFn: async (variables) =>
        (await deletePet({ ...options, ...variables, throwOnError: true })).data,
})
