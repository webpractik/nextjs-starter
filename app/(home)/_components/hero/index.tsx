'use client';
import { motion } from 'framer-motion';

const initialState = { filter: 'blur(10px)', opacity: 0, y: 40 };

const transition = {
    delay: 0.7,
    duration: 1,
    ease: 'easeInOut',
};

const whileInView = { filter: 'blur(0px)', opacity: 1, y: 0 };

export function Hero() {
    return (
        <div className="size-full relative flex flex-col h-[100vh] items-center justify-center bg-zinc-50 dark:bg-zinc-900  text-slate-950 transition-bg">
            <motion.div
                className="pointer-events-none relative flex flex-col items-center justify-center gap-4 px-4"
                initial={initialState}
                transition={transition}
                whileInView={whileInView}
            >
                <h1 className="bg-opacity/50 bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text text-center text-4xl font-bold text-transparent md:text-7xl">
                    Next Starter
                </h1>
                <div className="max-w-3xl bg-gradient-to-b from-neutral-50 to-neutral-400 bg-clip-text py-4 text-center font-extralight text-transparent md:text-2xl">
                    Этот стартовый комплект нацелен на предоставление разработчикам надежной основы
                    для создания приложений на Next.js, обеспечивая соблюдение лучших практик по
                    качеству кода, стилю и эффективности рабочих процессов.
                </div>
            </motion.div>
        </div>
    );
}
