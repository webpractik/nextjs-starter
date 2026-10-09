'use client'

import { getPetByIdOptions } from '@repo/api/query'
import { useQuery } from '@tanstack/react-query'

export function BrowserPet() {
    const pet = useQuery(getPetByIdOptions({ path: { petId: 'browser' } }))
    return <output aria-label="Browser SDK">{pet.data?.name ?? 'Loading'}</output>
}
