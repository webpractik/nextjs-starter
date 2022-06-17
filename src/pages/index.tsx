import Head from 'next/head';
import React from 'react';

function IndexPage() {
    return (
        <>
            <Head>
                <title>Next starter pack</title>
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <div style={{ textAlign: 'center' }}>
                <h1>Next.js starter pack</h1>
                {process.env.NEXT_PUBLIC_APP_ENV}
            </div>
        </>
    );
}

export default IndexPage;
