import Error from 'next/error';
import React from 'react';

function NotFoundPage() {
    return <Error statusCode={404} />;
}

export default NotFoundPage;
