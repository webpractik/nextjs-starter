// ВНИМАНИЕ: файл сгенерирован generate-mock-routes. Не редактируйте вручную.
import type { MockRoute } from '../mock-client'

import {
    fakeCreatePetResponse201,
    fakeFindPetsByStatusResponse200,
    fakeGetPetByIdResponse200,
    fakeUpdatePetResponse200,
} from './@faker-js/faker.gen'

export const mockRoutes = [
    {
        method: 'GET',
        pattern: /^\/pets$/,
        operationId: 'findPetsByStatus',
        tag: 'pets',
        create: fakeFindPetsByStatusResponse200,
    },
    {
        method: 'POST',
        pattern: /^\/pets$/,
        operationId: 'createPet',
        tag: 'pets',
        status: 201,
        create: fakeCreatePetResponse201,
    },
    {
        method: 'GET',
        pattern: /^\/pets\/[^/]+$/,
        operationId: 'getPetById',
        tag: 'pets',
        create: fakeGetPetByIdResponse200,
    },
    {
        method: 'PATCH',
        pattern: /^\/pets\/[^/]+$/,
        operationId: 'updatePet',
        tag: 'pets',
        create: fakeUpdatePetResponse200,
    },
    {
        method: 'DELETE',
        pattern: /^\/pets\/[^/]+$/,
        operationId: 'deletePet',
        tag: 'pets',
        status: 204,
    },
] satisfies MockRoute[]
