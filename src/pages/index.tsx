import React from 'react';

function IndexPage() {
    return (
        <div style={{ textAlign: 'center' }}>
            <h1>Next.js starter pack</h1>
            {process.env.NEXT_PUBLIC_APP_ENV}
        </div>
    );
}

export default IndexPage;
