import { getPetById } from '@repo/api'
import { pets } from '@repo/api/cache-tags'
import { zPet } from '@repo/api/schemas'
import { connection } from 'next/server'
import { Suspense } from 'react'

import { BrowserPet } from './client'

async function ServerPet() {
    await connection()
    const { data, response } = await getPetById({
        headers: { cookie: 'mock-mode=true' },
        path: { petId: 'server' },
        throwOnError: true,
    })
    const pet = zPet.parse(data)
    return (
        <main>
            <h1>API runtime smoke</h1>
            <output aria-label="Server SDK">{pet.name}</output>
            <output aria-label="Mock response">{response.headers.get('x-mock-mode')}</output>
            <output aria-label="Cache tag">{pets.petTag({ petId: pet.id })}</output>
            <BrowserPet />
        </main>
    )
}

export default function ApiRuntimePage() {
    return (
        <Suspense fallback={<p>Loading API runtime</p>}>
            <ServerPet />
        </Suspense>
    )
}
