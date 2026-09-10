import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { SanitizedHtml } from './sanitized-html'

const meta = {
    component: SanitizedHtml,
    title: 'core/SanitizedHtml',
    argTypes: {
        html: {
            control: false,
        },
    },
} satisfies Meta<typeof SanitizedHtml>

export default meta

type Story = StoryObj<typeof SanitizedHtml>

export const SafeRichText: Story = {
    args: {
        className: 'prose max-w-xl',
        html: `
            <h2>Обновление проекта</h2>
            <p>Текст может содержать <strong>акценты</strong>, ссылки и списки.</p>
            <ul><li>Безопасная разметка сохраняется</li><li>Опасная удаляется</li></ul>
        `,
    },
}

export const MixedUnsafeInput: Story = {
    render: () => (
        <SanitizedHtml
            className="prose max-w-xl"
            html={`
                <p>Этот текст <strong>останется</strong>.</p>
                <a href="javascript:alert('unsafe')">Опасная ссылка</a>
                <img src="missing.png" onerror="alert('unsafe')">
                <script>alert('unsafe')</script>
            `}
        />
    ),
}
