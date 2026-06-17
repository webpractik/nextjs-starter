const multilineClassname = {
    meta: {
        type: 'suggestion',
        fixable: 'code',
        schema: [],
        messages: {
            preferTemplate:
                'Multiline className strings can cause hydration errors. Use a template literal/expression instead.',
        },
    },
    create(context) {
        const escapeForTemplateLiteral = (value) =>
            value.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')

        return {
            JSXAttribute(node) {
                if (node.name?.type !== 'JSXIdentifier') return
                if (node.name.name !== 'className') return

                if (
                    node.value?.type === 'Literal' &&
                    typeof node.value.value === 'string' &&
                    node.value.value.includes('\n')
                ) {
                    const escaped = escapeForTemplateLiteral(node.value.value)

                    context.report({
                        node: node.value,
                        messageId: 'preferTemplate',
                        fix(fixer) {
                            return fixer.replaceText(node.value, `{\`${escaped}\`}`)
                        },
                    })
                }
            },
        }
    },
}

export default {
    meta: {
        name: 'preferTemplate',
    },
    rules: {
        'multiline-classname': multilineClassname,
    },
}
