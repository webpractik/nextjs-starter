import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { DownloadIcon, FileArchiveIcon, FileImageIcon, FileTextIcon, XIcon } from 'lucide-react'

import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentGroup,
    AttachmentMedia,
    AttachmentTitle,
    AttachmentTrigger,
} from '.'

const workspacePreview = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">
  <rect width="320" height="200" fill="#dbeafe" />
  <rect x="24" y="28" width="272" height="144" rx="12" fill="#fff" />
  <rect x="44" y="52" width="92" height="96" rx="8" fill="#bfdbfe" />
  <rect x="156" y="58" width="116" height="12" rx="6" fill="#94a3b8" />
  <rect x="156" y="84" width="92" height="10" rx="5" fill="#cbd5e1" />
  <rect x="156" y="108" width="104" height="10" rx="5" fill="#cbd5e1" />
</svg>
`)}`

const meta = {
    component: Attachment,
    title: 'core/Attachment',
} satisfies Meta<typeof Attachment>

export default meta

type Story = StoryObj<typeof Attachment>

export const DefaultFile: Story = {
    render: () => (
        <Attachment>
            <AttachmentMedia>
                <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>квартальный-отчёт.pdf</AttachmentTitle>
                <AttachmentDescription>PDF · 2,4 МБ</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
                <AttachmentAction aria-label="Скачать файл «квартальный-отчёт.pdf»">
                    <DownloadIcon />
                </AttachmentAction>
            </AttachmentActions>
        </Attachment>
    ),
}

export const ImagePreview: Story = {
    render: () => (
        <Attachment orientation="vertical">
            <AttachmentMedia variant="image">
                {/* oxlint-disable-next-line nextjs/no-img-element -- Attachment previews are caller-owned content. */}
                <img alt="Предпросмотр рабочей панели" src={workspacePreview} />
            </AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>рабочая-панель.png</AttachmentTitle>
                <AttachmentDescription>PNG · 820 КБ</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
                <AttachmentAction aria-label="Удалить файл «рабочая-панель.png»">
                    <XIcon />
                </AttachmentAction>
            </AttachmentActions>
        </Attachment>
    ),
}

const lifecycleStates = [
    { description: 'Ожидает загрузки', label: 'бриф.pdf', state: 'idle' },
    { description: 'Загрузка · 64%', label: 'исследование.pdf', state: 'uploading' },
    { description: 'Проверка файла', label: 'договор.pdf', state: 'processing' },
    {
        description: 'Не удалось загрузить: соединение потеряно',
        label: 'архив.zip',
        state: 'error',
    },
    { description: 'PDF · 1,8 МБ', label: 'счёт.pdf', state: 'done' },
] as const

export const LifecycleStates: Story = {
    render: () => (
        <div className="flex flex-col gap-3">
            {lifecycleStates.map((item) => (
                <Attachment key={item.state} state={item.state}>
                    <AttachmentMedia>
                        {item.state === 'error' ? <FileArchiveIcon /> : <FileTextIcon />}
                    </AttachmentMedia>
                    <AttachmentContent>
                        <AttachmentTitle>{item.label}</AttachmentTitle>
                        <AttachmentDescription>{item.description}</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                        <AttachmentAction aria-label={`Удалить файл «${item.label}»`}>
                            <XIcon />
                        </AttachmentAction>
                    </AttachmentActions>
                </Attachment>
            ))}
        </div>
    ),
}

const attachmentSizes = [
    ['default', 'Обычный размер'],
    ['sm', 'Маленький размер'],
    ['xs', 'Очень маленький размер'],
] as const

export const Sizes: Story = {
    render: () => (
        <div className="flex flex-col items-start gap-3">
            {attachmentSizes.map(([size, label]) => (
                <Attachment key={size} size={size}>
                    <AttachmentMedia>
                        <FileTextIcon />
                    </AttachmentMedia>
                    <AttachmentContent>
                        <AttachmentTitle>дизайн-система.pdf</AttachmentTitle>
                        <AttachmentDescription>{label} · 680 КБ</AttachmentDescription>
                    </AttachmentContent>
                </Attachment>
            ))}
        </div>
    ),
}

export const Trigger: Story = {
    render: () => (
        <Attachment>
            <AttachmentMedia>
                <FileImageIcon />
            </AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>рабочее-место.jpg</AttachmentTitle>
                <AttachmentDescription>JPG · 1,1 МБ</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
                <AttachmentAction aria-label="Удалить файл «рабочее-место.jpg»">
                    <XIcon />
                </AttachmentAction>
            </AttachmentActions>
            <AttachmentTrigger
                aria-label="Открыть файл «рабочее-место.jpg»"
                render={
                    <a href="#desk-reference">
                        <span className="sr-only">Открыть файл «рабочее-место.jpg»</span>
                    </a>
                }
            />
        </Attachment>
    ),
}

const groupFiles = [
    ['бриф-проекта.pdf', 'PDF · 480 КБ'],
    ['макеты.fig', 'FIG · 3,2 МБ'],
    ['заметки-исследования.md', 'Markdown · 24 КБ'],
    ['материалы-бренда.zip', 'ZIP · 8,7 МБ'],
    ['чек-лист-релиза.pdf', 'PDF · 920 КБ'],
] as const

export const Group: Story = {
    parameters: {
        layout: 'padded',
    },
    render: () => (
        <AttachmentGroup aria-label="Файлы проекта" className="mx-auto w-full max-w-md">
            {groupFiles.map(([name, description]) => (
                <Attachment key={name}>
                    <AttachmentMedia>
                        <FileTextIcon />
                    </AttachmentMedia>
                    <AttachmentContent>
                        <AttachmentTitle>{name}</AttachmentTitle>
                        <AttachmentDescription>{description}</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentTrigger aria-label={`Открыть файл «${name}»`} />
                </Attachment>
            ))}
        </AttachmentGroup>
    ),
}
