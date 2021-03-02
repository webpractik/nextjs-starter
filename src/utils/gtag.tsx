import React from 'react';

type GTagEvent = {
    action: string;
    category: string;
    label: string;
    value?: number;
};

export const GA_TRACKING_ID = '[Tracking ID]';

export const GoogleAnalyticsScripts = () => (
    <>
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`} />

        <script
            dangerouslySetInnerHTML={{
                __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}');
        `,
            }}
        />
    </>
);

export const pageview = (url: URL): void => {
    window.gtag('config', GA_TRACKING_ID, {
        page_path: url,
    });
};

export const event = ({ action, category, label, value }: GTagEvent): void => {
    window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value,
    });
};
