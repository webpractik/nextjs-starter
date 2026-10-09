import { adapterOas } from '@kubb/adapter-oas'
import { pluginClient } from '@kubb/plugin-client'
import { pluginFaker } from '@kubb/plugin-faker'
import { pluginTs } from '@kubb/plugin-ts'
import { pluginZod } from '@kubb/plugin-zod'
import { pascalCase } from 'change-case'
import { defineConfig } from 'kubb/config'

export default defineConfig({
    plugins: [
        pluginTs({
            enum: { constCasing: 'pascalCase', type: 'asConst', typeSuffix: '' },
            output: { barrel: { type: 'named' }, path: 'types' },
        }),
        pluginZod({ output: { barrel: { type: 'named' }, path: 'schemas' } }),
        pluginClient({
            importPath: '../../client',
            output: { barrel: { type: 'named' }, path: 'clients' },
            throwOnErrorDefault: false,
            validator: { response: 'zod' },
        }),
        pluginFaker({
            output: { barrel: { type: 'named' }, path: 'faker' },
            resolver: {
                name: (name) => `fake${pascalCase(name, { mergeAmbiguousCharacters: true })}`,
            },
            typeMode: 'schema',
        }),
    ],
    // Redocly validates the canonical 3.2 contract before this adapter runs.
    // Kubb's validator accepts only 2.0/3.0/3.1; parity checks cover our 3.2 subset.
    adapter: adapterOas({
        dateType: 'string',
        emptySchemaType: 'unknown',
        integerType: 'number',
        unknownType: 'unknown',
        validate: false,
    }),
    input: './bundled.yaml',
    output: { barrel: false, clean: true, path: './codegen' },
})
