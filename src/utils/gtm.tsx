import { useRouter } from 'next/router';
import Script from 'next/script';
import React, { useEffect } from 'react';

export const TRACKING_ID = '[Tracking ID]';

export function AnalyticsScripts() {
    const { events } = useRouter();

    const handleRouteChange = (url: string): void => {
        /* */
    };

    const onLoadEvent = () => {
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({
            'gtm.start': new Date().getTime(),
            event: 'gtm.js',
        });
    };

    useEffect(() => {
        events.on('routeChangeComplete', handleRouteChange);

        return () => {
            events.off('routeChangeComplete', handleRouteChange);
        };
    }, [events]);

    return (
        <Script
            src={`https://www.googletagmanager.com/gtm.js?id=${TRACKING_ID}`}
            onLoad={onLoadEvent}
        />
    );
}
