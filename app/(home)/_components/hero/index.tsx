'use client';
import { flag } from '@unleash/nextjs';
import { motion } from 'framer-motion';
import React from 'react';

import { AuroraBackground } from './aurora';

export async function Hero() {
    const isEnabled = await flag('epgu');

    return (
        <div className="size-full">
            <AuroraBackground>
                <motion.div
                    initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
                    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    className="pointer-events-none relative flex flex-col items-center justify-center gap-4 px-4"
                    transition={{
                        delay: 0.7,
                        duration: 1,
                        ease: 'easeInOut',
                    }}
                >
                    <h1 className="bg-opacity/50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-center text-4xl font-bold text-transparent md:text-7xl">
                        Next Starter
                    </h1>
                    <div>
                        Feature epgu toggle is:{' '}
                        <strong>{isEnabled ? 'ENABLED' : 'DISABLED'}</strong>
                    </div>
                    <div className="max-w-3xl bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text py-4 text-center font-extralight text-transparent md:text-2xl">
                        Этот стартовый комплект нацелен на предоставление разработчикам надежной
                        основы для создания приложений на Next.js, обеспечивая соблюдение лучших
                        практик по качеству кода, стилю и эффективности рабочих процессов.
                    </div>
                </motion.div>
            </AuroraBackground>
        </div>
    );
}
