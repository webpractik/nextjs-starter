import Error from 'next/error';
import React from 'react';

const NotFoundPage = () => <Error statusCode={404} />;

export default NotFoundPage;
