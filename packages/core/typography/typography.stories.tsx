import type { Meta, StoryObj } from '@storybook/react';

import { Typography } from './typography';

const meta: Meta<typeof Typography> = {
    component: Typography,
    title: 'core/Typography',
};

export default meta;

type Story = StoryObj<typeof Typography>;

export const Heading1: Story = {
    args: {
        children: 'Заголовок 1 (H1)',
        variant: 'h1',
    },
};

export const Heading2: Story = {
    args: {
        children: 'Заголовок 2 (H2)',
        variant: 'h2',
    },
};

export const Heading3: Story = {
    args: {
        children: 'Заголовок 3 (H3)',
        variant: 'h3',
    },
};

export const Heading4: Story = {
    args: {
        children: 'Заголовок 4 (H4)',
        variant: 'h4',
    },
};

export const Heading5: Story = {
    args: {
        children: 'Заголовок 5 (H5)',
        variant: 'h5',
    },
};

export const Heading6: Story = {
    args: {
        children: 'Заголовок 6 (H6)',
        variant: 'h6',
    },
};

export const PrimaryText = {
    args: {
        children:
            'Повседневная практика показывает, что начало повседневной работы по формированию позиции обеспечивает широкому кругу (специалистов) участие в формировании существенных финансовых и административных условий. Значимость этих проблем настолько очевидна, что постоянное информационно-пропагандистское обеспечение нашей деятельности играет важную роль в формировании позиций, занимаемых участниками в отношении поставленных задач.',
        color: 'primary',
        variant: 'p',
    },
};

export const SecondaryText = {
    args: {
        children:
            'Равным образом начало повседневной работы по формированию позиции влечет за собой процесс внедрения и модернизации направлений прогрессивного развития. Товарищи! сложившаяся структура организации способствует подготовки и реализации направлений прогрессивного развития.',
        color: 'secondary',
        variant: 'p',
    },
};
