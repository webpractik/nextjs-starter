'use client'

import { domAnimation, LazyMotion, m, useReducedMotion } from 'framer-motion'

import { Typography } from '#/components/ui/typography'

const initialState = { filter: 'blur(10px)', opacity: 0, y: 40 }

const reducedTransition = { delay: 0, duration: 0 }

const transition = {
    delay: 0.7,
    duration: 1,
    ease: 'easeInOut',
} as const

const whileInView = { filter: 'blur(0px)', opacity: 1, y: 0 }

export function Hero() {
    const shouldReduceMotion = useReducedMotion()

    return (
        <div className={`
            relative flex size-full h-dvh flex-col items-center justify-center bg-radial from-black
            to-black/95 text-slate-950
        `}>
            <LazyMotion features={domAnimation}>
                <m.div className={`
                    pointer-events-none relative flex flex-col items-center justify-center gap-4
                    px-4
                    motion-reduce:transform-none! motion-reduce:opacity-100!
                    motion-reduce:filter-none!
                `} initial={initialState} transition={shouldReduceMotion ? reducedTransition : transition} whileInView={whileInView}>
                    <Typography className={`
                    text-center text-4xl font-bold
                    text-neutral-100
                    md:text-7xl
                `} variant="h1">
                        Next Starter
                    </Typography>
                    <div className={`
                        max-w-3xl py-4 text-center font-extralight text-neutral-100
                        md:text-2xl
                    `}>Этот стартовый комплект нацелен на предоставление разработчикам надежной основы для создания приложений на Next.js, обеспечивая соблюдение лучших практик по качеству кода, стилю и эффективности рабочих процессов.</div>
                </m.div>
            </LazyMotion>
        </div>
    )
}
