import { Box } from 'core/Box';
import { Logo } from 'core/Logo';
import { Typography } from 'core/Typography';
import React, { ReactNode } from 'react';

import { Title } from '@/(home)/_components/Title';

function HomeLayout({ children }: Readonly<{ children: ReactNode }>) {
    return (
        <Box center direction="column" style={{ minHeight: '100dvh', padding: '3rem' }} gap="2rem">
            <Logo />

            <Title />

            <Box width="50%" margin="0 auto 2rem">
                <Typography center variant="p" color="secondary">
                    Этот стартовый комплект нацелен на предоставление разработчикам надежной основы
                    для создания приложений на Next.js, обеспечивая соблюдение лучших практик по
                    качеству кода, стилю и эффективности рабочих процессов.
                </Typography>
            </Box>

            {children}
        </Box>
    );
}

export default HomeLayout;
