import Script from 'next/script';
import React from 'react';

type GTagEvent = {
    action: string;
    category: string;
    label: string;
    value?: number;
};

export const TRACKING_ID = '[Tracking ID]';

export const GoogleAnalyticsScripts = () => (
    <>
        <Script
            src={`https://www.googletagmanager.com/gtm.js?id=${TRACKING_ID}`}
            onLoad={() => {
                window.dataLayer = window.dataLayer || [];
                window.dataLayer.push({
                    'gtm.start': new Date().getTime(),
                    event: 'gtm.js',
                });
            }}
        />
    </>
);

export const pageview = (url: URL): void => {
    window.gtag('config', TRACKING_ID, {
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
