import express from 'express';
import next from 'next';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';

const app = next({ dev: process.env.NODE_ENV === 'development' });
const handle = app.getRequestHandler();
const port = 8080;

app.prepare()
    .then(() => {
        const server = express();
        const { NODE_ENV, API_URL, HTTP_AUTH } = process.env;

        console.log(`Server running in ${NODE_ENV} mode.`);

        server.use(cors());

        server.use(
            '/api',
            createProxyMiddleware({
                target: API_URL,
                auth: HTTP_AUTH,
                pathRewrite: path => path.replace('/api', ''),
                changeOrigin: true,
            })
        );

        server.all('*', (req, res) => handle(req, res));

        server.listen(port, err => {
            if (err) throw err;
            console.log(`> Proxy-server has been started on http://localhost:${port}`);
            console.log(`> All requests proxying on ${API_URL}`);
        });
    })
    .catch(err => {
        console.log('Error:::::', err);
    });
