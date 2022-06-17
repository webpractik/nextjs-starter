import express from 'express';
import next from 'next';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const port = process.env.FRONT_INTERNAL_PORT || 3000;

const app = next({
    dev: process.env.NODE_ENV === 'development',
    host: process.env.FRONT_INTERNAL_HOST,
    port,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
    const server = express();

    server.use(
        cors({
            origin: process.env.NODE_ENV === 'production' ? process.env.FRONT_PUBLIC_URL : '*',
        })
    );

    server.use(
        '/api',
        createProxyMiddleware({
            target: process.env.BACK_INTERNAL_URL,
            // auth: `${process.env.HTTP_AUTH_LOGIN}:${process.env.HTTP_AUTH_PASS}`,
            pathRewrite: path => path.replace('/api', ''),
            changeOrigin: true,
        })
    );

    // Проксирование socket.io
    // const wsProxy = createProxyMiddleware('/socket.io', {
    //     target: process.env.BACK_INTERNAL_URL,
    //     changeOrigin: true,
    //     ws: true,
    //     logLevel: process.env.NODE_ENV === 'development' ? 'debug' : 'silent',
    // });
    // server.use(wsProxy);
    // server.on('upgrade', wsProxy.upgrade);

    server.all('*', (req, res) => handle(req, res));

    server.listen(port, err => {
        if (err) throw err;
        console.log(`Server running in ${process.env.NODE_ENV} mode.`);
        console.log(`Server has been started on http://${process.env.FRONT_HOST}:${port}`);
        console.log(`All requests proxying on ${process.env.BACK_INTERNAL_URL}`);
    });
});
