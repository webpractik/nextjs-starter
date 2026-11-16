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

it('показывает данные вложения и не запускает открытие при нажатии отдельного действия', async () => {
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

    const trigger = screen.getByRole('button', { name: 'Open contract.pdf' })

    await expect.element(screen.getByText('contract.pdf')).toBeVisible()
    await expect.element(screen.getByText('Uploading · 64%')).toBeVisible()
    await expect.element(screen.getByText('PDF', { exact: true })).toBeVisible()
    await expect.element(trigger).toHaveAttribute('type', 'button')
    await screen.getByRole('button', { name: 'Remove contract.pdf' }).click()
    expect(onAction).toHaveBeenCalledTimes(1)
    expect(onOpen).not.toHaveBeenCalled()

    await trigger.click()
    expect(onOpen).toHaveBeenCalledTimes(1)
})

it('показывает изображение и ошибку, сохраняет пользовательскую ссылку и прокрутку группы', async () => {
    const screen = await render(
        <AttachmentGroup aria-label="Project files" role="list" style={{ width: 180 }}>
            <Attachment state="done">
                <AttachmentMedia variant="image">
                    {/* oxlint-disable-next-line nextjs/no-img-element -- This verifies caller-owned native image media. */}
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

    const image = screen.getByRole('img', { name: 'Workspace preview' })
    const group = screen.getByRole('list', { name: 'Project files' })

    await expect.element(image).toBeVisible()
    await expect
        .element(screen.getByRole('link', { name: 'View workspace.png' }))
        .toHaveAttribute('href', '#workspace')
    await expect.element(screen.getByText('Upload failed: connection lost')).toBeVisible()

    expect(group.element().scrollWidth).toBeGreaterThan(group.element().clientWidth)
    group.element().scrollLeft = group.element().scrollWidth
    await expect.poll(() => group.element().scrollLeft).toBeGreaterThan(0)
})
