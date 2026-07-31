// ВНИМАНИЕ: файл сгенерирован kubb-plugin-cache-tags. Не редактируйте вручную.
import { updateTag } from 'next/cache'

export const petsTag = 'pets' as const

export function petTag(params: { petId: string | number }): `pets:petId:${string}` {
    return `pets:petId:${params.petId}`
}

export async function revalidatePets() {
    updateTag(petsTag)
}

export async function revalidatePet(params: { petId: string | number }): Promise<void> {
    updateTag(petTag(params))
}
