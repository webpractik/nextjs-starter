'use client'

import { TanStackDevtools } from '@tanstack/react-devtools'

import { formDevtoolsPlugins } from './form-devtools-plugins'

export function FormDevtools() {
    return <TanStackDevtools plugins={formDevtoolsPlugins} />
}
