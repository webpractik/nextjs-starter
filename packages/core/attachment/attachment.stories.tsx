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

const meta: Meta<typeof Attachment> = {
    component: Attachment,
    title: 'core/Attachment',
}

export default meta

type Story = StoryObj<typeof Attachment>

export const DefaultFile: Story = {
    render: () => (
        <Attachment>
            <AttachmentMedia>
                <FileTextIcon />
            </AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>quarterly-report.pdf</AttachmentTitle>
                <AttachmentDescription>PDF · 2.4 MB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
                <AttachmentAction aria-label="Download quarterly-report.pdf">
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
                {/* oxlint-disable-next-line next/no-img-element -- Attachment previews are caller-owned content. */}
                <img alt="Workspace dashboard preview" src={workspacePreview} />
            </AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>workspace.png</AttachmentTitle>
                <AttachmentDescription>PNG · 820 KB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
                <AttachmentAction aria-label="Remove workspace.png">
                    <XIcon />
                </AttachmentAction>
            </AttachmentActions>
        </Attachment>
    ),
}

const lifecycleStates = [
    { description: 'Waiting to upload', label: 'brief.pdf', state: 'idle' },
    { description: 'Uploading · 64%', label: 'research.pdf', state: 'uploading' },
    { description: 'Scanning file', label: 'contract.pdf', state: 'processing' },
    { description: 'Upload failed: connection lost', label: 'archive.zip', state: 'error' },
    { description: 'PDF · 1.8 MB', label: 'invoice.pdf', state: 'done' },
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
                        <AttachmentAction aria-label={`Remove ${item.label}`}>
                            <XIcon />
                        </AttachmentAction>
                    </AttachmentActions>
                </Attachment>
            ))}
        </div>
    ),
}

export const Sizes: Story = {
    render: () => (
        <div className="flex flex-col items-start gap-3">
            {(['default', 'sm', 'xs'] as const).map((size) => (
                <Attachment key={size} size={size}>
                    <AttachmentMedia>
                        <FileTextIcon />
                    </AttachmentMedia>
                    <AttachmentContent>
                        <AttachmentTitle>design-system.pdf</AttachmentTitle>
                        <AttachmentDescription>{size} · 680 KB</AttachmentDescription>
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
                <AttachmentTitle>desk-reference.jpg</AttachmentTitle>
                <AttachmentDescription>JPG · 1.1 MB</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
                <AttachmentAction aria-label="Remove desk-reference.jpg">
                    <XIcon />
                </AttachmentAction>
            </AttachmentActions>
            <AttachmentTrigger
                aria-label="Open desk-reference.jpg"
                render={
                    <a href="#desk-reference">
                        <span className="sr-only">Open desk-reference.jpg</span>
                    </a>
                }
            />
        </Attachment>
    ),
}

const groupFiles = [
    ['project-brief.pdf', 'PDF · 480 KB'],
    ['wireframes.fig', 'FIG · 3.2 MB'],
    ['research-notes.md', 'Markdown · 24 KB'],
    ['brand-assets.zip', 'ZIP · 8.7 MB'],
    ['release-checklist.pdf', 'PDF · 920 KB'],
] as const

export const Group: Story = {
    render: () => (
        <AttachmentGroup aria-label="Project files" className="max-w-md">
            {groupFiles.map(([name, description]) => (
                <Attachment key={name}>
                    <AttachmentMedia>
                        <FileTextIcon />
                    </AttachmentMedia>
                    <AttachmentContent>
                        <AttachmentTitle>{name}</AttachmentTitle>
                        <AttachmentDescription>{description}</AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentTrigger aria-label={`Open ${name}`} />
                </Attachment>
            ))}
        </AttachmentGroup>
    ),
}
