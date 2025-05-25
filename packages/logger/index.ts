import adze, { setup } from 'adze';

const appName = process.env.APP_NAME as string;

const store = setup({
    activeLevel: 'info',
    format: 'pretty',
});

store.addListener('alert', (log: adze) => {
    console.info(log);
});

const logger = adze.withEmoji.timestamp.ns(appName).seal();

export default logger;
