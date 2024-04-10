import { Meta, StoryObj } from '@storybook/react';

import { Typography } from './typography';

const meta: Meta<typeof Typography> = {
    title: 'core/Typography',
    component: Typography,
};

export default meta;

type Story = StoryObj<typeof Typography>;

export const Heading1: Story = {
    args: {
        variant: 'h1',
        children: 'Заголовок 1 (H1)',
    },
};

export const Heading2: Story = {
    args: {
        variant: 'h2',
        children: 'Заголовок 2 (H2)',
    },
};

export const Heading3: Story = {
    args: {
        variant: 'h3',
        children: 'Заголовок 3 (H3)',
    },
};

export const Heading4: Story = {
    args: {
        variant: 'h4',
        children: 'Заголовок 4 (H4)',
    },
};

export const Heading5: Story = {
    args: {
        variant: 'h5',
        children: 'Заголовок 5 (H5)',
    },
};

export const Heading6: Story = {
    args: {
        variant: 'h6',
        children: 'Заголовок 6 (H6)',
    },
};

export const PrimaryText = {
    args: {
        variant: 'p',
        color: 'primary',
        children:
            // eslint-disable-next-line max-len
            'Повседневная практика показывает, что начало повседневной работы по формированию позиции обеспечивает широкому кругу (специалистов) участие в формировании существенных финансовых и административных условий. Значимость этих проблем настолько очевидна, что постоянное информационно-пропагандистское обеспечение нашей деятельности играет важную роль в формировании позиций, занимаемых участниками в отношении поставленных задач.',
    },
};

export const SecondaryText = {
    args: {
        variant: 'p',
        color: 'secondary',
        children:
            // eslint-disable-next-line max-len
            'Равным образом начало повседневной работы по формированию позиции влечет за собой процесс внедрения и модернизации направлений прогрессивного развития. Товарищи! сложившаяся структура организации способствует подготовки и реализации направлений прогрессивного развития.',
    },
};
