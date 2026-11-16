'use client'

import { useQuery } from '@tanstack/react-query'

import { getPetByIdOptions } from '#/api/query'

export function BrowserPet() {
    const pet = useQuery(getPetByIdOptions({ path: { petId: 'browser' } }))
    return <output aria-label="Browser SDK">{pet.data?.name ?? 'Loading'}</output>
}
