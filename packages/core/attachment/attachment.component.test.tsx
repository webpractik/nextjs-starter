import { expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-react'

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

it('composes attachment slots, variants, trigger, and independent actions', async () => {
    const onAction = vi.fn()
    const onOpen = vi.fn()
    const screen = await render(
        <Attachment state="uploading" size="sm" orientation="vertical">
            <AttachmentMedia>PDF</AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>contract.pdf</AttachmentTitle>
                <AttachmentDescription>Uploading · 64%</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
                <AttachmentAction aria-label="Remove contract.pdf" onClick={onAction}>
                    Remove
                </AttachmentAction>
            </AttachmentActions>
            <AttachmentTrigger aria-label="Open contract.pdf" onClick={onOpen} />
        </Attachment>,
    )

    const attachment = screen
        .getByText('contract.pdf')
        .element()
        .closest('[data-slot="attachment"]')

    expect(attachment).not.toBeNull()
    expect(attachment).toHaveAttribute('data-state', 'uploading')
    expect(attachment).toHaveAttribute('data-size', 'sm')
    expect(attachment).toHaveAttribute('data-orientation', 'vertical')
    expect(attachment?.querySelector('[data-slot="attachment-media"]')).not.toBeNull()
    expect(attachment?.querySelector('[data-slot="attachment-content"]')).not.toBeNull()
    expect(attachment?.querySelector('[data-slot="attachment-actions"]')).not.toBeNull()

    const trigger = screen.getByRole('button', { name: 'Open contract.pdf' })

    await expect.element(trigger).toHaveAttribute('type', 'button')
    await screen.getByRole('button', { name: 'Remove contract.pdf' }).click()
    expect(onAction).toHaveBeenCalledOnce()
    expect(onOpen).not.toHaveBeenCalled()

    await trigger.click()
    expect(onOpen).toHaveBeenCalledOnce()
})

it('supports image media, custom trigger rendering, and grouped overflow styles', async () => {
    const screen = await render(
        <AttachmentGroup aria-label="Project files">
            <Attachment state="done">
                <AttachmentMedia variant="image">
                    {/* oxlint-disable-next-line next/no-img-element -- This verifies caller-owned native image media. */}
                    <img alt="Workspace preview" src="/workspace.png" />
                </AttachmentMedia>
                <AttachmentContent>
                    <AttachmentTitle>workspace.png</AttachmentTitle>
                    <AttachmentDescription>PNG · 820 KB</AttachmentDescription>
                </AttachmentContent>
                <AttachmentTrigger
                    aria-label="View workspace.png"
                    render={
                        <a href="#workspace">
                            <span className="sr-only">View workspace.png</span>
                        </a>
                    }
                />
            </Attachment>
            <Attachment state="error" size="xs">
                <AttachmentMedia>ZIP</AttachmentMedia>
                <AttachmentContent>
                    <AttachmentTitle>source-files.zip</AttachmentTitle>
                    <AttachmentDescription>Upload failed: connection lost</AttachmentDescription>
                </AttachmentContent>
            </Attachment>
        </AttachmentGroup>,
    )

    const imageMedia = screen
        .getByRole('img', { name: 'Workspace preview' })
        .element()
        .closest('[data-slot="attachment-media"]')
    const group = document.querySelector('[data-slot="attachment-group"]')

    expect(imageMedia).toHaveAttribute('data-variant', 'image')
    await expect
        .element(screen.getByRole('link', { name: 'View workspace.png' }))
        .toHaveAttribute('href', '#workspace')
    expect(group).toHaveClass('scroll-fade-x', 'no-scrollbar', 'snap-x', 'overflow-x-auto')
    await expect.element(screen.getByText('Upload failed: connection lost')).toBeVisible()
})
