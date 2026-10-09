// ВНИМАНИЕ: файл сгенерирован из OpenAPI/Kubb. Не редактируйте вручную.

import type { FactoryOptions } from '../factory-options'
export {
    fakeCreatePet,
    fakeCreatePet2,
    fakeCreatePetBody,
    fakeCreatePetStatus201,
    fakeCreatePetStatus422,
    fakeDeletePetPath,
    fakeDeletePetStatus204,
    fakeDeletePetStatus404,
    fakeFindPetsByStatusQuery,
    fakeFindPetsByStatusStatus200,
    fakeFindPetsByStatusStatus422,
    fakeGetPetByIdPath,
    fakeGetPetByIdStatus200,
    fakeGetPetByIdStatus404,
    fakePet,
    fakePet2,
    fakePetPage,
    fakePetPage2,
    fakePetStatus,
    fakePetStatus2,
    fakeProblem,
    fakeProblem2,
    fakeUpdatePet,
    fakeUpdatePet2,
    fakeUpdatePetBody,
    fakeUpdatePetPath,
    fakeUpdatePetStatus200,
    fakeUpdatePetStatus404,
    fakeUpdatePetStatus422,
} from './faker'
export type { FactoryOptions as Options } from '../factory-options'
import { fakeFindPetsByStatusQuery } from './faker'
export function fakeFindPetsByStatusRequest(options: FactoryOptions = {}) {
    return { query: fakeFindPetsByStatusQuery(options) }
}
export { fakeFindPetsByStatusStatus200 as fakeFindPetsByStatusResponse200 } from './faker'
export { fakeFindPetsByStatusStatus422 as fakeFindPetsByStatusResponse422 } from './faker'
import { fakeCreatePetBody } from './faker'
export function fakeCreatePetRequest(options: FactoryOptions = {}) {
    return { body: fakeCreatePetBody(options) }
}
export { fakeCreatePetStatus201 as fakeCreatePetResponse201 } from './faker'
export { fakeCreatePetStatus422 as fakeCreatePetResponse422 } from './faker'
import { fakeGetPetByIdPath } from './faker'
export function fakeGetPetByIdRequest(options: FactoryOptions = {}) {
    return { path: fakeGetPetByIdPath(options) }
}
export { fakeGetPetByIdStatus200 as fakeGetPetByIdResponse200 } from './faker'
export { fakeGetPetByIdStatus404 as fakeGetPetByIdResponse404 } from './faker'
import { fakeUpdatePetPath, fakeUpdatePetBody } from './faker'
export function fakeUpdatePetRequest(options: FactoryOptions = {}) {
    return { path: fakeUpdatePetPath(options), body: fakeUpdatePetBody(options) }
}
export { fakeUpdatePetStatus200 as fakeUpdatePetResponse200 } from './faker'
export { fakeUpdatePetStatus404 as fakeUpdatePetResponse404 } from './faker'
export { fakeUpdatePetStatus422 as fakeUpdatePetResponse422 } from './faker'
import { fakeDeletePetPath } from './faker'
export function fakeDeletePetRequest(options: FactoryOptions = {}) {
    return { path: fakeDeletePetPath(options) }
}
export { fakeDeletePetStatus404 as fakeDeletePetResponse404 } from './faker'
