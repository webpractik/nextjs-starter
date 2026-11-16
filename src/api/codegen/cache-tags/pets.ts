import { updateTag } from 'next/cache'

// ВНИМАНИЕ: файл сгенерирован generate-cache-tags. Не редактируйте вручную.
import 'server-only'

export const petsTag = 'pets' as const

export function petTag(params: { petId: string }): `pets:petId:${string}` {
    return `pets:petId:${params.petId}`
}

export async function revalidatePets() {
    updateTag(petsTag)
}

export async function revalidatePet(params: { petId: string }): Promise<void> {
    updateTag(petTag(params))
}
