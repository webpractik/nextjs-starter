import adze, { setup } from 'adze';

const format = 'pretty';
const activeLevel = 'info';

const store = setup({
    activeLevel,
    format,
});

store.addListener('alert', (log: adze) => {
    console.info(log);
});

const logger = adze.withEmoji.timestamp.ns('app').seal();

export default logger;
