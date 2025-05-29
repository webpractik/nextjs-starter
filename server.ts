import logger from '@repo/logger';
import { environment } from '#/env/server';
import compression from 'compression';
import next from 'next';
import fs from 'node:fs';
import https from 'node:https';

const development = process.env.NODE_ENV !== 'production';
const app = next({ dev: development, port: environment.FRONT_PORT });
const handle = app.getRequestHandler();

async function startServer() {
    await app.prepare();

    https
        .createServer(
            {
                cert: fs.readFileSync('./cert.pem'),
                key: fs.readFileSync('./key.pem'),
            },
            async (request, response) => {
                compression({
                    filter: (_request, _response) => {
                        if (_request.headers?.['accept-encoding']?.includes('br')) {
                            _response.setHeader('Content-Encoding', 'br');
                        }

                        return compression.filter(_request, _response);
                    },
                    level: 9,
                    threshold: 10_240,
                });

                response.setHeader(
                    'Link',
                    '</styles.css>; rel=preload; as=style, </main.js>; rel=preload; as=script'
                );

                await handle(request, response);
            }
        )
        .listen(environment.FRONT_PORT);

    logger.info(`Ready on https://localhost:${String(environment.FRONT_PORT)}`);
}

// eslint-disable-next-line unicorn/prefer-top-level-await
startServer().catch(error => {
    console.error(error);
    process.exit(1);
});
