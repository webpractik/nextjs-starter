'use client'

import dynamic from 'next/dynamic'

const FormDevtools =
    process.env.NODE_ENV === 'development'
        ? dynamic(() => import('./form-devtools').then((module) => module.FormDevtools), {
              ssr: false,
          })
        : null

export function FormDevtoolsProvider() {
    return FormDevtools ? <FormDevtools /> : null
}
