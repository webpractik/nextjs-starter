export const parameters = {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
    viewport: {
        viewports: {
            mobileSmall: {
                name: 'Телефоны 320px',
                styles: {
                    width: '320px',
                    height: '750px',
                },
            },
            mobile: {
                name: 'Телефоны',
                styles: {
                    width: '575px',
                    height: '812px',
                },
            },
            tablet: {
                name: 'iPad',
                styles: {
                    width: '767px',
                    height: '1024px',
                },
            },
            laptop: {
                name: 'Планшет',
                styles: {
                    width: '1024px',
                    height: '768px',
                },
            },
            desktop: {
                name: 'ПК',
                styles: {
                    width: '1440px',
                    height: '1024px',
                },
            },
        },
    },
};
