import Document, { Head, Html, Main, NextScript } from 'next/document';
import React from 'react';

import { GoogleAnalyticsScripts } from '@/utils/gtag';

const isProduction = process.env.NODE_ENV === 'production';

export default class MyDocument extends Document {
    render() {
        return (
            <Html>
                <Head>{isProduction && <GoogleAnalyticsScripts />}</Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
