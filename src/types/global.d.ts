import '@total-typescript/ts-reset';

declare module '*.module.sass' {
    const styles: { [className: string]: string };
    export default styles;
}

declare module '*.svg';

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

type ExpandRecursively<T> = T extends object
    ? T extends infer O
        ? { [K in keyof O]: ExpandRecursively<O[K]> }
        : never
    : T;
