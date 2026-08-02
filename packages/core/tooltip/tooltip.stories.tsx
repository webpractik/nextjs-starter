import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import { HelpCircleIcon, InfoIcon, PlusIcon } from 'lucide-react'

import { Button } from '../button'
import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip'

const meta: Meta<typeof Tooltip> = {
    component: Tooltip,
    title: 'core/Tooltip',
}

export default meta

type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>Наведите курсор</TooltipTrigger>
            <TooltipContent>Это подсказка</TooltipContent>
        </Tooltip>
    ),
}

export const Top: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>Сверху</TooltipTrigger>
            <TooltipContent side="top">Подсказка сверху</TooltipContent>
        </Tooltip>
    ),
}

export const Bottom: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>Снизу</TooltipTrigger>
            <TooltipContent side="bottom">Подсказка снизу</TooltipContent>
        </Tooltip>
    ),
}

export const Left: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>Слева</TooltipTrigger>
            <TooltipContent side="left">Подсказка слева</TooltipContent>
        </Tooltip>
    ),
}

export const Right: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>Справа</TooltipTrigger>
            <TooltipContent side="right">Подсказка справа</TooltipContent>
        </Tooltip>
    ),
}

export const WithIcon: Story = {
    render: () => (
        <div className="flex items-center gap-2">
            <span>Нужна помощь?</span>
            <Tooltip>
                <TooltipTrigger
                    render={<HelpCircleIcon className="size-4 cursor-help text-muted-foreground" />}
                />
                <TooltipContent>Нажмите, чтобы узнать больше</TooltipContent>
            </Tooltip>
        </div>
    ),
}

export const OnIconButton: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger
                render={<Button variant="outline" size="icon" aria-label="Добавить элемент" />}
            >
                <PlusIcon />
            </TooltipTrigger>
            <TooltipContent>Добавить новый элемент</TooltipContent>
        </Tooltip>
    ),
}

export const AllSides: Story = {
    render: () => (
        <div className="flex items-center justify-center gap-4 p-20">
            <Tooltip>
                <TooltipTrigger render={<Button variant="outline" />}>Сверху</TooltipTrigger>
                <TooltipContent side="top">Подсказка сверху</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger render={<Button variant="outline" />}>Справа</TooltipTrigger>
                <TooltipContent side="right">Подсказка справа</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger render={<Button variant="outline" />}>Снизу</TooltipTrigger>
                <TooltipContent side="bottom">Подсказка снизу</TooltipContent>
            </Tooltip>
            <Tooltip>
                <TooltipTrigger render={<Button variant="outline" />}>Слева</TooltipTrigger>
                <TooltipContent side="left">Подсказка слева</TooltipContent>
            </Tooltip>
        </div>
    ),
}

export const WithLongContent: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>
                <InfoIcon className="mr-2 size-4" />
                Информация
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
                Это подсказка с более длинным текстом. Здесь можно разместить подробную информацию
                об элементе, на который наведён курсор.
            </TooltipContent>
        </Tooltip>
    ),
}

export const WithOffset: Story = {
    render: () => (
        <Tooltip>
            <TooltipTrigger render={<Button variant="outline" />}>Со смещением</TooltipTrigger>
            <TooltipContent sideOffset={16}>Подсказка со смещением 16 пикселей</TooltipContent>
        </Tooltip>
    ),
}
