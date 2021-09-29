declare module '*.module.sass' {
    const styles: { [className: string]: string };
    export default styles;
}

declare module '*.svg';

interface Window {
    dataLayer: Record<string, any>[];
    ga: (...args: any[]) => void;
}
