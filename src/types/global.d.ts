declare module '*.module.sass' {
    const styles: { [className: string]: string };
    export default styles;
}

declare module '*.svg';

declare global {
    interface Window {
        dataLayer: any[];
        ga: (...args: any[]) => void;
    }
}
