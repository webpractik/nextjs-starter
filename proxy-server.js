import express from 'express';
import next from 'next';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const dev = process.env.NODE_ENV === 'development';
const apiUrl = process.env.API_URL;
const port = dev ? 8080 : 3000;
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare()
    .then(() => {
        const server = express();

        console.log(`Server running in ${process.env.NODE_ENV} mode.`);

        server.use(cors());

        server.use(
            '/api',
            createProxyMiddleware({
                target: apiUrl,
                pathRewrite: path => {
                    return path.replace('/api', '');
                },
                auth: process.env.HTTP_AUTH,
                changeOrigin: true,
            })
        );

        server.all('*', (req, res) => handle(req, res));

        server.listen(port, err => {
            if (err) throw err;

            if (dev) {
                console.log(`> Proxy-server has been started on http://localhost:${port}`);
                console.log(`> All requests proxying on ${apiUrl}`);
            }
        });
    })
    .catch(err => {
        console.log('Error:::::', err);
    });
