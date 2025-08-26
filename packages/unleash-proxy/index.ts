/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable no-console */
import { createApp } from '@unleash/proxy';
import { config } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: path.resolve(__dirname, '../../.env') });

const PORT = process.env.UNLEASH_PROXY_PORT || 4242;

const app = createApp({
    clientKeys: [process.env.NEXT_PUBLIC_UNLEASH_FRONTEND_API_TOKEN || 'proxy-secret'],
    refreshInterval: 1000,
    unleashApiToken: process.env.UNLEASH_SERVER_API_TOKEN,
    unleashAppName: process.env.NEXT_PUBLIC_UNLEASH_APP_NAME,
    unleashInstanceId: process.env.UNLEASH_SERVER_INSTANCE_ID,
    unleashUrl: process.env.UNLEASH_SERVER_API_URL,
});

app.listen(PORT, () => {
    console.log(`Unleash Proxy listening on http://localhost:${PORT.toString()}/proxy`);
});
