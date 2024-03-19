import { Logo } from '@repo/core/logo';
import { Typography } from 'components/core/typography';
import React from 'react';

import styles from './welcome.module.css';

export function Welcome() {
    return (
        <>
            <Logo />

            <Typography variant="h1" className={styles.title}>
                <span className={styles.letter}>N</span>
                <span className={styles.letter}>e</span>
                <span className={styles.letter}>x</span>
                <span className={styles.letter}>t</span>
                &nbsp;
                <span className={styles.letter}>S</span>
                <span className={styles.letter}>t</span>
                <span className={styles.letter}>a</span>
                <span className={styles.letter}>r</span>
                <span className={styles.letter}>t</span>
                <span className={styles.letter}>e</span>
                <span className={styles.letter}>r</span>
            </Typography>

            <div className="mx-auto mb-8 mt-0 flex items-center justify-center">
                <Typography variant="p" color="secondary" className="w-1/2 text-center">
                    Этот стартовый комплект нацелен на предоставление разработчикам надежной основы
                    для создания приложений на Next.js, обеспечивая соблюдение лучших практик по
                    качеству кода, стилю и эффективности рабочих процессов.
                </Typography>
            </div>
        </>
    );
}
