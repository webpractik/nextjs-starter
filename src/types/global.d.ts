declare module '*.module.sass' {
    const styles: { [className: string]: string };
    export default styles;
}

declare module '*.svg';

declare const window: CustomWindow;

declare interface CustomWindow extends Window {
    gtag: gtag;
}
